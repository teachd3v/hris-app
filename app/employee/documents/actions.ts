'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { uploadToStorage, deleteFromStorage } from '@/lib/storage'
import { validateUpload, DOCUMENT_KINDS, MB } from '@/lib/upload'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DocumentCategory } from '@/lib/dummy-data'

export async function getDocuments() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) return []
  const employee = empRecords[0]

  const docs = await db.select()
    .from(schema.employee_documents)
    .where(eq(schema.employee_documents.employee_id, employee.id))
    .orderBy(desc(schema.employee_documents.created_at))

  return docs.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    size: doc.size ?? '',
    date: doc.date ? new Date(doc.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
    category: doc.category as DocumentCategory,
    subCategory: doc.sub_category ?? undefined,
    fileUrl: doc.file_url ?? undefined,
    files: (typeof doc.files === 'string' ? JSON.parse(doc.files) : doc.files || []) as Array<{ url: string; name: string; size: string; type: string }>
  }))
}

const MAX_FILE = 15 * MB
const MAX_TOTAL = 40 * MB
const MAX_FILES = 10

type StoredFile = { url: string; name: string; size: string; type: string }

export async function uploadDocument(formData: FormData): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  const id = (formData.get('id') as string | null) || null
  const title = String(formData.get('title') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const subCategory = String(formData.get('subCategory') ?? '').trim()
  const newFiles = (formData.getAll('file') as File[]).filter((f) => f instanceof File && f.size > 0)

  if (!title || title.length > 200) return { error: 'Judul dokumen wajib diisi (maks. 200 karakter)' }
  if (!category || category.length > 100 || subCategory.length > 100) return { error: 'Kategori dokumen tidak valid' }
  if (newFiles.length > MAX_FILES) return { error: `Maksimal ${MAX_FILES} file per dokumen` }
  if (newFiles.reduce((a, f) => a + f.size, 0) > MAX_TOTAL) return { error: `Total ukuran file maksimal ${MAX_TOTAL / MB} MB` }

  // File lama hanya boleh berasal dari dokumen milik karyawan ini (tidak boleh disuntik dari klien)
  let existingFiles: StoredFile[] = []
  if (id) {
    const [doc] = await db.select().from(schema.employee_documents)
      .where(and(eq(schema.employee_documents.id, id), eq(schema.employee_documents.employee_id, employee.id))).limit(1)
    if (!doc) return { error: 'Dokumen tidak ditemukan' }
    const current: StoredFile[] = typeof doc.files === 'string' ? JSON.parse(doc.files) : (doc.files as StoredFile[] | null) || []
    let keepUrls: string[] = []
    try {
      const parsed = JSON.parse(String(formData.get('existingFiles') ?? '[]'))
      keepUrls = Array.isArray(parsed) ? parsed.map((f: { url?: unknown }) => String(f?.url ?? '')) : []
    } catch {
      return { error: 'Data file lama tidak valid' }
    }
    existingFiles = current.filter((f) => keepUrls.includes(f.url))
    // File yang dibuang dari daftar dihapus dari storage
    const prefix = `/storage/documents/${employee.id}/`
    for (const removed of current.filter((f) => !keepUrls.includes(f.url))) {
      if (removed.url.startsWith(prefix)) await deleteFromStorage(removed.url.slice('/storage/'.length)).catch((e) => console.error('Error deleting removed file', e))
    }
  }

  // Validasi semua file baru sebelum ada yang diunggah
  const validated: { file: File; v: Extract<Awaited<ReturnType<typeof validateUpload>>, { ok: true }> }[] = []
  for (const file of newFiles) {
    const v = await validateUpload(file, { maxBytes: MAX_FILE, kinds: DOCUMENT_KINDS, name: file.name })
    if (!v.ok) return { error: v.error }
    validated.push({ file, v })
  }

  const finalFiles: StoredFile[] = [...existingFiles]
  const uploadedKeys: string[] = []
  try {
    for (const { file, v } of validated) {
      const key = `documents/${employee.id}/${Date.now()}-${crypto.randomUUID()}.${v.ext}`
      await uploadToStorage(key, v.buffer, v.contentType)
      uploadedKeys.push(key)
      finalFiles.push({
        url: `/storage/${key}`,
        name: file.name.slice(0, 200),
        size: `${(v.size / MB).toFixed(1)} MB`,
        type: v.ext.toUpperCase(),
      })
    }
  } catch (e) {
    console.error('Error uploading to storage:', e)
    await Promise.all(uploadedKeys.map((k) => deleteFromStorage(k).catch(() => {})))
    return { error: 'Gagal mengunggah file ke penyimpanan' }
  }

  if (finalFiles.length === 0) return { error: 'Minimal satu file harus diunggah' }

  // Use the first file as primary for legacy support if needed
  const primaryFile = finalFiles[0]

  const dbData = {
    employee_id: employee.id,
    title,
    category,
    sub_category: subCategory,
    type: primaryFile.type,
    size: primaryFile.size,
    date: new Date().toISOString(),
    file_url: primaryFile.url,
    files: JSON.stringify(finalFiles) // Ensure object is stringified for SQLite D1
  }

  if (id) {
    await db.update(schema.employee_documents).set(dbData).where(and(eq(schema.employee_documents.id, id), eq(schema.employee_documents.employee_id, employee.id)))
  } else {
    await db.insert(schema.employee_documents).values({
      ...dbData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    })
  }

  revalidatePath('/employee/documents')
  return {}
}

export async function deleteDocument(id: string, _fileUrl?: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  // Ambil file dari database (bukan dari klien) dan hapus semuanya dari storage
  const [doc] = await db.select().from(schema.employee_documents)
    .where(and(eq(schema.employee_documents.id, id), eq(schema.employee_documents.employee_id, employee.id))).limit(1)
  if (!doc) throw new Error('Dokumen tidak ditemukan')

  const files: StoredFile[] = typeof doc.files === 'string' ? JSON.parse(doc.files) : (doc.files as StoredFile[] | null) || []
  const urls = new Set([...files.map((f) => f.url), ...(doc.file_url ? [doc.file_url] : [])])
  const prefix = `/storage/documents/${employee.id}/`
  for (const url of urls) {
    if (!url.startsWith(prefix)) continue
    try {
      await deleteFromStorage(url.slice('/storage/'.length))
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError)
    }
  }

  await db.delete(schema.employee_documents).where(and(eq(schema.employee_documents.id, id), eq(schema.employee_documents.employee_id, employee.id)))

  revalidatePath('/employee/documents')
}

export async function getEmployeeBasicProfile() {
  const session = await auth()
  if (!session?.user?.email) return null

  const db = getDb()
  const empRecords = await db.select({ name: schema.employees.name, photo_url: schema.employees.photo_url }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  
  if (empRecords.length === 0) return null
  return empRecords[0]
}
