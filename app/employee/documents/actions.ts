'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getStorageClient, BUCKET_NAME, uploadToStorage, deleteFromStorage } from '@/lib/storage'
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

export async function uploadDocument(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  const id = formData.get('id') as string | null
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const subCategory = formData.get('subCategory') as string
  const newFiles = formData.getAll('file') as File[]
  const existingFilesJson = formData.get('existingFiles') as string
  const existingFiles = existingFilesJson ? JSON.parse(existingFilesJson) : []

  const finalFiles = [...existingFiles]

  // 1. Upload new files to Storage
  for (const file of newFiles) {
    if (file.size === 0) continue // Skip empty files

    const fileExt = file.name.split('.').pop()
    const fileName = `documents/${employee.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      await uploadToStorage(fileName, buffer, file.type || 'application/octet-stream')
      const r2PublicUrl = process.env.R2_PUBLIC_URL || `https://pub-placeholder.r2.dev`
      
      finalFiles.push({
        url: `${r2PublicUrl}/${fileName}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fileExt?.toUpperCase() || 'FILE'
      })
    } catch (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      throw new Error(`Failed to upload ${file.name} to storage`)
    }
  }

  if (finalFiles.length === 0) {
    throw new Error('Minimal satu file harus diunggah')
  }

  // Use the first file as primary for legacy support if needed
  const primaryFile = finalFiles[0]

  const dbData = {
    employee_id: employee.id,
    title: title,
    category: category,
    sub_category: subCategory,
    type: primaryFile.type,
    size: primaryFile.size,
    date: new Date().toISOString(),
    file_url: primaryFile.url,
    files: JSON.stringify(finalFiles) // Ensure object is stringified for SQLite D1
  }

  if (id) {
    // 2. Update existing record
    await db.update(schema.employee_documents).set(dbData).where(and(eq(schema.employee_documents.id, id), eq(schema.employee_documents.employee_id, employee.id)))
  } else {
    // 3. Insert new record
    await db.insert(schema.employee_documents).values({
      ...dbData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    })
  }

  revalidatePath('/employee/documents')
}

export async function deleteDocument(id: string, fileUrl: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  // Extract path from URL
  const urlParts = fileUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]
  const filePath = `documents/${employee.id}/${fileName}`

  // 1. Delete from Storage
  try {
    await deleteFromStorage(filePath)
  } catch (storageError) {
    console.error('Error deleting from storage:', storageError)
    // We continue even if storage delete fails
  }

  // 2. Delete from Database
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
