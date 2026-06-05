'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DocumentCategory } from '@/lib/dummy-data'

export async function getDocuments() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data.map(doc => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    size: doc.size ?? '',
    date: doc.date ? new Date(doc.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
    category: doc.category as DocumentCategory,
    subCategory: doc.sub_category ?? undefined,
    fileUrl: doc.file_url ?? undefined,
    files: (doc.files || []) as Array<{ url: string; name: string; size: string; type: string }>
  }))
}

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
    if (file.size === 0) continue // Skip empty files (happens with empty inputs)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      throw new Error(`Failed to upload ${file.name} to storage`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    finalFiles.push({
      url: publicUrl,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: fileExt?.toUpperCase() || 'FILE'
    })
  }

  if (finalFiles.length === 0) {
    throw new Error('Minimal satu file harus diunggah')
  }

  // Use the first file as primary for legacy support if needed
  const primaryFile = finalFiles[0]

  const dbData = {
    employee_id: user.id,
    title: title,
    category: category,
    sub_category: subCategory,
    type: primaryFile.type,
    size: primaryFile.size,
    date: new Date().toISOString(),
    file_url: primaryFile.url,
    files: finalFiles
  }

  if (id) {
    // 2. Update existing record
    const { error: dbError } = await supabase
      .from('employee_documents')
      .update(dbData)
      .eq('id', id)
      .eq('employee_id', user.id)

    if (dbError) {
      console.error('Error updating DB:', dbError)
      throw new Error('Failed to update document metadata')
    }
  } else {
    // 3. Insert new record
    const { error: dbError } = await supabase
      .from('employee_documents')
      .insert(dbData)

    if (dbError) {
      console.error('Error saving to DB:', dbError)
      throw new Error('Failed to save document metadata')
    }
  }

  revalidatePath('/employee/documents')
}

export async function deleteDocument(id: string, fileUrl: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Extract path from URL
  // Example: https://.../storage/v1/object/public/documents/USER_ID/filename.pdf
  // We need "USER_ID/filename.pdf"
  const urlParts = fileUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]
  const filePath = `${user.id}/${fileName}`

  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath])

  if (storageError) {
    console.error('Error deleting from storage:', storageError)
    // We continue even if storage delete fails, as the record is the primary source
  }

  // 2. Delete from Database
  const { error: dbError } = await supabase
    .from('employee_documents')
    .delete()
    .eq('id', id)
    .eq('employee_id', user.id)

  if (dbError) {
    console.error('Error deleting from DB:', dbError)
    throw new Error('Failed to delete document from database')
  }

  revalidatePath('/employee/documents')
}
