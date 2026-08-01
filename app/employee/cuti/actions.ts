'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { BUCKET_NAME, uploadToStorage, deleteFromStorage } from '@/lib/storage'
import { eq, and, desc, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type LeaveStatus = 'PENDING_DIRECT_MANAGER' | 'PENDING_HC_ADMIN' | 'APPROVED' | 'REJECTED';
export type LeaveCategory = 
  | 'Cuti Tahunan' 
  | 'Cuti Ayah' 
  | 'Cuti Berkabung' 
  | 'Cuti Melahirkan' 
  | 'Cuti Pernikahan' 
  | 'Cuti Unpaid' 
  | 'Sakit' 
  | 'Ganti Hari' 
  | 'Izin Terlambat' 
  | 'Izin Pulang Cepat' 
  | 'Dinas Luar Kota';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: LeaveCategory;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
  status: LeaveStatus;
  start_time?: string | null;
  end_time?: string | null;
  attachment_url?: string | null;
  spd_id?: string | null;
  
  // Approvals
  manager_approved_by?: string | null;
  manager_approved_at?: string | null;
  manager_notes?: string | null;
  manager_name?: string | null;
  
  hc_approved_by?: string | null;
  hc_approved_at?: string | null;
  hc_notes?: string | null;
  hc_name?: string | null;
  
  created_at: string;
}

// 1. Ambil data cuti untuk user yang sedang login
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')
  
  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id, name: schema.employees.name }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) return []
  const employee = empRecords[0]

  const records = await db.select()
    .from(schema.leave_requests)
    .where(eq(schema.leave_requests.employee_id, employee.id))
    .orderBy(desc(schema.leave_requests.created_at))

  return records.map((r: any) => ({
    ...r,
    duration_days: r.total_days ? parseFloat(r.total_days) : 0,
    employee_name: employee.name
  }))
}

// 2. Ambil informasi profile karyawan terkait kuota cuti, atasan, & gender
export async function getEmployeeLeaveInfo() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select().from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Gagal memuat profil karyawan')
  const employee = empRecords[0]

  let managerName = null
  if (employee.manager_id) {
    const managerRecords = await db.select({ name: schema.employees.name }).from(schema.employees).where(eq(schema.employees.id, employee.manager_id)).limit(1)
    if (managerRecords.length > 0) managerName = managerRecords[0].name
  }

  const leaveTotal = employee.leave_total !== null ? Number(employee.leave_total) : 12;
  const leaveUsed = employee.leave_used !== null ? Number(employee.leave_used) : 0;

  return {
    id: employee.id,
    name: employee.name,
    gender: employee.gender || 'Laki-laki',
    leave_total: leaveTotal,
    leave_used: leaveUsed,
    leave_available: leaveTotal - leaveUsed,
    leave_ganti_hari: employee.leave_ganti_hari !== null ? Number(employee.leave_ganti_hari) : 0,
    manager_id: employee.manager_id,
    manager_name: managerName,
    dept: employee.dept
  }
}

// 3. Buat pengajuan cuti baru
export async function createLeaveRequest(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id, manager_id: schema.employees.manager_id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  const leaveType = formData.get('leave_type') as LeaveCategory
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const durationDays = parseFloat(formData.get('duration_days') as string)
  const reason = formData.get('reason') as string
  const startTime = formData.get('start_time') as string | null
  const endTime = formData.get('end_time') as string | null
  const file = formData.get('attachment') as File | null

  // Validasi input
  if (!leaveType || !startDate || !endDate || isNaN(durationDays) || !reason) {
    throw new Error('Semua kolom wajib diisi dengan benar')
  }

  let attachmentUrl = null

  // Upload file lampiran jika ada
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `leave_attachments/${employee.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      await uploadToStorage(fileName, buffer, file.type || 'application/octet-stream')
      const r2PublicUrl = process.env.R2_PUBLIC_URL || `https://pub-placeholder.r2.dev`
      attachmentUrl = `${r2PublicUrl}/${fileName}`
    } catch (uploadError) {
      console.error('Error uploading attachment:', uploadError)
      throw new Error('Gagal mengunggah berkas lampiran')
    }
  }

  const initialStatus = employee.manager_id ? 'PENDING_DIRECT_MANAGER' : 'PENDING_HC_ADMIN'

  await db.insert(schema.leave_requests).values({
    id: crypto.randomUUID(),
    employee_id: employee.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    total_days: durationDays.toString(),
    reason: reason,
    status: initialStatus,
    start_time: startTime || null,
    end_time: endTime || null,
    attachment_url: attachmentUrl,
    created_at: new Date().toISOString()
  })

  revalidatePath('/employee/cuti')
}

// 4. Batalkan pengajuan cuti (hanya jika status masih PENDING_DIRECT_MANAGER)
export async function cancelLeaveRequest(id: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  const reqRecords = await db.select({ id: schema.leave_requests.id, status: schema.leave_requests.status, attachment_url: schema.leave_requests.attachment_url }).from(schema.leave_requests).where(and(eq(schema.leave_requests.id, id), eq(schema.leave_requests.employee_id, employee.id))).limit(1)
  
  if (reqRecords.length === 0) {
    throw new Error('Pengajuan tidak ditemukan')
  }

  const request = reqRecords[0]
  if (request.status !== 'PENDING_DIRECT_MANAGER') {
    throw new Error('Pengajuan sudah diproses, tidak dapat dibatalkan')
  }

  // Hapus berkas lampiran di storage jika ada
  if (request.attachment_url) {
    const urlParts = request.attachment_url.split('/')
    // Extract everything after the public domain (e.g. leave_attachments/id/filename)
    const filePath = `leave_attachments/${employee.id}/${urlParts[urlParts.length - 1]}`
    try {
      await deleteFromStorage(filePath)
    } catch (e) {
      console.error('Failed to delete attachment from S3', e)
    }
  }

  await db.delete(schema.leave_requests).where(eq(schema.leave_requests.id, id))

  revalidatePath('/employee/cuti')
}

// 5. Ambil data cuti yang membutuhkan persetujuan manager
export async function getManagerApprovals(): Promise<LeaveRequest[]> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) return []
  const manager = empRecords[0]

  // Cari semua bawahan (karyawan yang manager_id = user.id)
  const subordinates = await db.select({ id: schema.employees.id, name: schema.employees.name, dept: schema.employees.dept, title: schema.employees.title }).from(schema.employees).where(eq(schema.employees.manager_id, manager.id))
  
  if (subordinates.length === 0) return []
  
  const subordinateIds = subordinates.map(s => s.id)
  
  let allRequests: any[] = []
  
  for (const sub of subordinates) {
    const reqs = await db.select().from(schema.leave_requests).where(and(eq(schema.leave_requests.employee_id, sub.id), eq(schema.leave_requests.status, 'PENDING_DIRECT_MANAGER')))
    const mappedReqs = reqs.map((r: any) => ({
      ...r,
      duration_days: r.total_days ? parseFloat(r.total_days) : 0,
      employee_name: sub.name,
      employees: { name: sub.name, dept: sub.dept, title: sub.title }
    }))
    allRequests = [...allRequests, ...mappedReqs]
  }

  return allRequests
}

// 6. Approval/Rejection oleh Direct Manager
export async function approveByManager(id: string, isApproved: boolean, notes: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const manager = empRecords[0]

  const reqRecords = await db.select().from(schema.leave_requests).where(eq(schema.leave_requests.id, id)).limit(1)
  if (reqRecords.length === 0) throw new Error('Pengajuan tidak ditemukan')
  const request = reqRecords[0]

  // Pastikan pengaju adalah bawahan manager ini
  const subRecords = await db.select({ manager_id: schema.employees.manager_id }).from(schema.employees).where(eq(schema.employees.id, request.employee_id ?? '')).limit(1)
  if (subRecords.length === 0 || subRecords[0].manager_id !== manager.id) {
    throw new Error('Anda tidak memiliki wewenang untuk menyetujui pengajuan ini')
  }

  const nextStatus = isApproved ? 'PENDING_HC_ADMIN' : 'REJECTED'

  await db.update(schema.leave_requests).set({
    status: nextStatus,
    manager_approved_by: manager.id,
    manager_approved_at: new Date().toISOString(),
    manager_notes: notes
  }).where(eq(schema.leave_requests.id, id))

  revalidatePath('/employee/cuti')
}

// 7. Ambil data cuti yang membutuhkan persetujuan final HC Admin
export async function getHCAdminApprovals(): Promise<LeaveRequest[]> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id, role: schema.employees.role }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0 || empRecords[0].role !== 'Admin') throw new Error('Unauthorized')

  const reqRecords = await db.select().from(schema.leave_requests).where(eq(schema.leave_requests.status, 'PENDING_HC_ADMIN')).orderBy(asc(schema.leave_requests.created_at))
  
  const results = [];
  for (const req of reqRecords) {
    const subRecords = await db.select({ name: schema.employees.name, dept: schema.employees.dept, title: schema.employees.title }).from(schema.employees).where(eq(schema.employees.id, req.employee_id ?? '')).limit(1)
    results.push({
      ...req,
      duration_days: req.total_days ? parseFloat(req.total_days) : 0,
      employee_name: subRecords.length > 0 ? subRecords[0].name : 'Unknown',
      employees: subRecords.length > 0 ? subRecords[0] : null
    })
  }

  return results as LeaveRequest[]
}

// 8. Approval/Rejection oleh HC Admin
export async function approveByHC(id: string, isApproved: boolean, notes: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id, role: schema.employees.role }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0 || empRecords[0].role !== 'Admin') throw new Error('Unauthorized')
  const hcAdmin = empRecords[0]

  const nextStatus = isApproved ? 'APPROVED' : 'REJECTED'

  await db.update(schema.leave_requests).set({
    status: nextStatus,
    hc_approved_by: hcAdmin.id,
    hc_approved_at: new Date().toISOString(),
    hc_notes: notes
  }).where(eq(schema.leave_requests.id, id))

  revalidatePath('/employee/cuti')
}

// 9. Ambil daftar cuti APPROVED dari rekan kerja dalam departemen yang sama (untuk Kalender Tim)
export async function getTeamApprovedLeaves(): Promise<LeaveRequest[]> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id, dept: schema.employees.dept }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0 || !empRecords[0].dept) return []
  const currentEmployee = empRecords[0]

  // Cari semua approved leave dari departemen yang sama
  // Note: We'll fetch all approved, then filter by dept. Drizzle doesn't support complex JOINs in simple select() yet without query builder relations
  const reqRecords = await db.select().from(schema.leave_requests).where(eq(schema.leave_requests.status, 'APPROVED'))
  
  const results = [];
  for (const req of reqRecords) {
    const subRecords = await db.select({ name: schema.employees.name, dept: schema.employees.dept }).from(schema.employees).where(eq(schema.employees.id, req.employee_id ?? '')).limit(1)
    if (subRecords.length > 0 && subRecords[0].dept === currentEmployee.dept) {
      results.push({
        ...req,
        duration_days: req.total_days ? parseFloat(req.total_days) : 0,
        employee_name: subRecords[0].name,
        employees: subRecords[0]
      })
    }
  }

  return results as LeaveRequest[]
}
