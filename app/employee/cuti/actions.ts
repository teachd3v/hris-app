'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase as any)
    .from('leave_requests')
    .select(`
      *,
      employees!leave_requests_employee_id_fkey(name)
    `)
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leave requests:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    ...item,
    employee_name: item.employees?.name
  }))
}

// 2. Ambil informasi profile karyawan terkait kuota cuti, atasan, & gender
export async function getEmployeeLeaveInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Ambil profile karyawan (cast to any to allow new columns manager_id and leave_ganti_hari)
  const { data: employee, error: empError } = await (supabase as any)
    .from('employees')
    .select('id, name, gender, leave_total, leave_used, leave_ganti_hari, manager_id, dept')
    .eq('id', user.id)
    .single()

  if (empError || !employee) {
    console.error('Error fetching employee leave info:', empError)
    throw new Error('Gagal memuat profil karyawan')
  }

  // Ambil info manager (nama) jika ada
  let managerName = null
  if (employee.manager_id) {
    const { data: manager } = await supabase
      .from('employees')
      .select('name')
      .eq('id', employee.manager_id)
      .single()
    managerName = manager?.name || null
  }

  return {
    id: employee.id,
    name: employee.name,
    gender: employee.gender || 'Laki-laki',
    leave_total: employee.leave_total || 12,
    leave_used: employee.leave_used || 0,
    leave_available: (employee.leave_total || 12) - (employee.leave_used || 0),
    leave_ganti_hari: employee.leave_ganti_hari || 0,
    manager_id: employee.manager_id,
    manager_name: managerName,
    dept: employee.dept
  }
}

// 3. Buat pengajuan cuti baru
export async function createLeaveRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('leave_attachments')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading attachment:', uploadError)
      throw new Error('Gagal mengunggah berkas lampiran')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('leave_attachments')
      .getPublicUrl(fileName)

    attachmentUrl = publicUrl
  }

  // Jika yang mengajukan adalah Chief / pimpinan tertinggi (tidak punya manager_id),
  // langsung lompat ke PENDING_HC_ADMIN.
  const { data: empProfile } = await (supabase as any)
    .from('employees')
    .select('manager_id')
    .eq('id', user.id)
    .single()

  const initialStatus = empProfile?.manager_id ? 'PENDING_DIRECT_MANAGER' : 'PENDING_HC_ADMIN'

  const insertData = {
    employee_id: user.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    duration_days: durationDays,
    reason: reason,
    status: initialStatus,
    start_time: startTime || null,
    end_time: endTime || null,
    attachment_url: attachmentUrl
  }

  const { error } = await (supabase as any)
    .from('leave_requests')
    .insert(insertData)

  if (error) {
    console.error('Error inserting leave request:', error)
    throw new Error('Gagal menyimpan pengajuan cuti: ' + error.message)
  }

  revalidatePath('/employee/cuti')
}

// 4. Batalkan pengajuan cuti (hanya jika status masih PENDING_DIRECT_MANAGER)
export async function cancelLeaveRequest(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Pastikan record milik user dan status pending
  const { data: request, error: fetchError } = await (supabase as any)
    .from('leave_requests')
    .select('status, attachment_url')
    .eq('id', id)
    .eq('employee_id', user.id)
    .single()

  if (fetchError || !request) {
    throw new Error('Pengajuan tidak ditemukan')
  }

  if (request.status !== 'PENDING_DIRECT_MANAGER') {
    throw new Error('Pengajuan sudah diproses, tidak dapat dibatalkan')
  }

  // Hapus berkas lampiran di storage jika ada
  if (request.attachment_url) {
    const urlParts = request.attachment_url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${user.id}/${fileName}`
    await supabase.storage.from('leave_attachments').remove([filePath])
  }

  // Hapus dari database
  const { error } = await (supabase as any)
    .from('leave_requests')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Gagal membatalkan pengajuan: ' + error.message)
  }

  revalidatePath('/employee/cuti')
}

// 5. Ambil data cuti yang membutuhkan persetujuan manager
export async function getManagerApprovals(): Promise<LeaveRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Cari semua leave_requests dari bawahan langsung (karyawan yang manager_id = user.id)
  const { data, error } = await (supabase as any)
    .from('leave_requests')
    .select(`
      *,
      employees!leave_requests_employee_id_fkey(name, dept, title)
    `)
    .eq('status', 'PENDING_DIRECT_MANAGER')
    .eq('employees.manager_id', user.id)

  if (error) {
    console.error('Error fetching manager approvals:', error)
    return []
  }

  // Filter out any entries where join returned null for employee details (safety check)
  return (data || [])
    .filter((item: any) => item.employees !== null)
    .map((item: any) => ({
      ...item,
      employee_name: item.employees?.name
    }))
}

// 6. Approval/Rejection oleh Direct Manager
export async function approveByManager(id: string, isApproved: boolean, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Cari request & pastikan pengaju adalah bawahan manager ini
  const { data: request, error: fetchError } = await (supabase as any)
    .from('leave_requests')
    .select('*, employees!leave_requests_employee_id_fkey(manager_id)')
    .eq('id', id)
    .single()

  if (fetchError || !request) throw new Error('Pengajuan tidak ditemukan')
  if (request.employees?.manager_id !== user.id) throw new Error('Anda tidak memiliki wewenang untuk menyetujui pengajuan ini')

  const nextStatus = isApproved ? 'PENDING_HC_ADMIN' : 'REJECTED'

  const { error } = await (supabase as any)
    .from('leave_requests')
    .update({
      status: nextStatus,
      manager_approved_by: user.id,
      manager_approved_at: new Date().toISOString(),
      manager_notes: notes
    })
    .eq('id', id)

  if (error) throw new Error('Gagal memproses persetujuan manager: ' + error.message)

  revalidatePath('/employee/cuti')
}

// 7. Ambil data cuti yang membutuhkan persetujuan final HC Admin
export async function getHCAdminApprovals(): Promise<LeaveRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Pastikan user adalah Admin
  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (employee?.role !== 'Admin') throw new Error('Unauthorized')

  const { data, error } = await (supabase as any)
    .from('leave_requests')
    .select(`
      *,
      employees!leave_requests_employee_id_fkey(name, dept, title)
    `)
    .eq('status', 'PENDING_HC_ADMIN')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching HC approvals:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    ...item,
    employee_name: item.employees?.name
  }))
}

// 8. Approval/Rejection oleh HC Admin
export async function approveByHC(id: string, isApproved: boolean, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Pastikan user adalah Admin
  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (employee?.role !== 'Admin') throw new Error('Unauthorized')

  const nextStatus = isApproved ? 'APPROVED' : 'REJECTED'

  const { error } = await (supabase as any)
    .from('leave_requests')
    .update({
      status: nextStatus,
      hc_approved_by: user.id,
      hc_approved_at: new Date().toISOString(),
      hc_notes: notes
    })
    .eq('id', id)

  if (error) throw new Error('Gagal memproses persetujuan HC: ' + error.message)

  revalidatePath('/employee/cuti')
}

// 9. Ambil daftar cuti APPROVED dari rekan kerja dalam departemen yang sama (untuk Kalender Tim)
export async function getTeamApprovedLeaves(): Promise<LeaveRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Ambil departemen user saat ini
  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('dept')
    .eq('id', user.id)
    .single()

  if (!currentEmployee || !currentEmployee.dept) return []

  // Cari semua approved leave dari departemen yang sama
  const { data, error } = await (supabase as any)
    .from('leave_requests')
    .select(`
      *,
      employees!leave_requests_employee_id_fkey(name, dept)
    `)
    .eq('status', 'APPROVED')
    .eq('employees.dept', currentEmployee.dept)

  if (error) {
    console.error('Error fetching team leaves:', error)
    return []
  }

  return (data || []).map((item: any) => ({
    ...item,
    employee_name: item.employees?.name
  }))
}
