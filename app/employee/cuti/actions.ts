'use server'

import { auth } from '@/auth'
import { getAdminContext } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { uploadToStorage, deleteFromStorage } from '@/lib/storage'
import { validateUpload, DOCUMENT_KINDS, MB } from '@/lib/upload'
import { getLeaveBalances, type LeaveBalance } from '@/lib/leave-balance'
import { isTopLeader } from '@/lib/org'
import { loadHolidayDates } from '@/lib/holidays'
import { LEAVE_TYPES, LEAVE_TYPE_KEYS, calculateLeaveDuration, validateLeaveDates, parseIsoDate, type LeaveCategory } from '@/lib/leave'
import { eq, and, desc, asc, inArray, or, lte, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type LeaveStatus = 'PENDING_DIRECT_MANAGER' | 'PENDING_HC_ADMIN' | 'APPROVED' | 'REJECTED';

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

type ActionResult = { error?: string }

const ATTACHMENT_MAX = 5 * MB
const NOTES_MAX = 500
const REASON_MAX = 1000
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const PENDING: LeaveStatus[] = ['PENDING_DIRECT_MANAGER', 'PENDING_HC_ADMIN']

async function currentEmployee() {
  const session = await auth()
  const employeeId = session?.user?.id
  if (!session?.user?.email || !employeeId) throw new Error('Not authenticated')
  const db = getDb()
  const [employee] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!employee) throw new Error('Employee not found')
  return { db, employee }
}

const toRequest = (r: any, extra: Partial<LeaveRequest> = {}): LeaveRequest => ({
  ...r,
  duration_days: r.total_days ? parseFloat(r.total_days) : 0,
  ...extra,
})

// 1. Ambil data cuti untuk user yang sedang login
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const { db, employee } = await currentEmployee()
  const records = await db.select()
    .from(schema.leave_requests)
    .where(eq(schema.leave_requests.employee_id, employee.id))
    .orderBy(desc(schema.leave_requests.created_at))
  return records.map((r) => toRequest(r, { employee_name: employee.name ?? undefined }))
}

// 2. Profil karyawan + jatah cuti per jenis
async function loadEmployeeLeaveInfo() {
  const { db, employee } = await currentEmployee()

  let managerName = null
  if (employee.manager_id) {
    const [m] = await db.select({ name: schema.employees.name }).from(schema.employees).where(eq(schema.employees.id, employee.manager_id)).limit(1)
    if (m) managerName = m.name
  }

  const balances = await getLeaveBalances(db, employee, new Date().getUTCFullYear())
  const annual = balances.find((b) => b.type === 'Cuti Tahunan')!
  const swap = balances.find((b) => b.type === 'Ganti Hari')!

  return {
    id: employee.id,
    name: employee.name,
    gender: employee.gender || 'Laki-laki',
    leave_total: annual.quota ?? 0,
    leave_used: annual.used,
    leave_available: annual.remaining ?? 0,
    leave_ganti_hari: swap.remaining ?? 0,
    balances,
    manager_id: employee.manager_id,
    manager_name: managerName,
    dept: employee.dept,
  }
}

export type EmployeeLeaveInfo = Awaited<ReturnType<typeof loadEmployeeLeaveInfo>>

// Mengembalikan pesan error (bukan throw) karena Next.js menyembunyikan pesan throw di produksi
export async function getEmployeeLeaveInfo(): Promise<EmployeeLeaveInfo | { error: string }> {
  try {
    return await loadEmployeeLeaveInfo()
  } catch (e) {
    console.error('getEmployeeLeaveInfo failed', e)
    return { error: e instanceof Error ? e.message : 'Kesalahan tidak dikenal' }
  }
}

// 3. Buat pengajuan cuti baru. Semua aturan divalidasi di server.
export async function createLeaveRequest(formData: FormData): Promise<ActionResult> {
  const { db, employee } = await currentEmployee()

  const leaveType = String(formData.get('leave_type') ?? '') as LeaveCategory
  const startDate = String(formData.get('start_date') ?? '')
  const endDate = String(formData.get('end_date') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  const startTime = String(formData.get('start_time') ?? '') || null
  const endTime = String(formData.get('end_time') ?? '') || null
  const file = formData.get('attachment')

  // Semua karyawan wajib punya atasan, kecuali pucuk pimpinan (langsung ke HC)
  if (!employee.manager_id && !isTopLeader(employee)) {
    return { error: 'Atasan langsung Anda belum ditetapkan. Hubungi HC/Admin untuk mengaturnya sebelum mengajukan cuti.' }
  }

  const meta = LEAVE_TYPES.find((t) => t.key === leaveType)
  if (!meta || !LEAVE_TYPE_KEYS.includes(leaveType)) return { error: 'Jenis cuti tidak valid' }
  // Hari libur (nasional / cuti bersama) tidak dihitung sebagai hari kerja
  const holidays = await loadHolidayDates(db, startDate, endDate)
  const dateError = validateLeaveDates(leaveType, startDate, endDate, holidays)
  if (dateError) return { error: dateError }
  if (!reason) return { error: 'Alasan wajib diisi' }
  if (reason.length > REASON_MAX) return { error: `Alasan maksimal ${REASON_MAX} karakter` }

  // Durasi dihitung server, bukan dari klien
  const duration = calculateLeaveDuration(leaveType, startDate, endDate, holidays)
  if (duration > 366) return { error: 'Durasi pengajuan terlalu panjang' }

  if (meta.gender && employee.gender && employee.gender !== meta.gender) {
    return { error: `${meta.label} hanya diperuntukkan bagi karyawan ${meta.gender}` }
  }
  if (meta.timeBased) {
    if (!startTime || !endTime || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return { error: 'Detail jam wajib diisi dengan format yang benar' }
  }

  // Tidak boleh tumpang tindih dengan pengajuan lain yang masih berlaku
  const overlap = await db
    .select({ id: schema.leave_requests.id })
    .from(schema.leave_requests)
    .where(and(
      eq(schema.leave_requests.employee_id, employee.id),
      inArray(schema.leave_requests.status, [...PENDING, 'APPROVED']),
      lte(schema.leave_requests.start_date, endDate),
      gte(schema.leave_requests.end_date, startDate),
    ))
    .limit(1)
  if (overlap.length > 0) return { error: 'Tanggal ini bertumpang tindih dengan pengajuan Anda yang lain' }

  // Kuota (menghitung yang sudah disetujui + yang sedang menunggu)
  const balances = await getLeaveBalances(db, employee, Number(startDate.slice(0, 4)))
  const balance = balances.find((b) => b.type === leaveType)!
  if (balance.remaining !== null && duration > balance.remaining) {
    return { error: `Kuota ${meta.label} tidak mencukupi (tersisa ${Math.max(balance.remaining, 0)} hari)` }
  }

  // Lampiran
  let attachmentUrl: string | null = null
  let attachment: { key: string; buffer: ArrayBuffer; contentType: string } | null = null
  if (file instanceof File && file.size > 0) {
    const v = await validateUpload(file, { maxBytes: ATTACHMENT_MAX, kinds: DOCUMENT_KINDS, name: file.name })
    if (!v.ok) return { error: v.error }
    const key = `leave_attachments/${employee.id}/${Date.now()}-${crypto.randomUUID()}.${v.ext}`
    attachment = { key, buffer: v.buffer, contentType: v.contentType }
    attachmentUrl = `/storage/${key}`
  } else if (meta.requiresAttachment) {
    return { error: 'Dokumen lampiran (surat keterangan) wajib diunggah' }
  }

  if (attachment) {
    try {
      await uploadToStorage(attachment.key, attachment.buffer, attachment.contentType)
    } catch (e) {
      console.error('Error uploading attachment:', e)
      return { error: 'Gagal mengunggah berkas lampiran' }
    }
  }

  const now = new Date().toISOString()
  try {
    await db.insert(schema.leave_requests).values({
      id: crypto.randomUUID(),
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      total_days: duration.toString(),
      reason,
      status: employee.manager_id ? 'PENDING_DIRECT_MANAGER' : 'PENDING_HC_ADMIN',
      start_time: meta.timeBased ? startTime : null,
      end_time: meta.timeBased ? endTime : null,
      attachment_url: attachmentUrl,
      created_at: now,
      updated_at: now,
    })
  } catch (e) {
    if (attachment) await deleteFromStorage(attachment.key).catch(() => {})
    throw e
  }

  revalidatePath('/employee/cuti')
  return {}
}

// 4. Batalkan pengajuan (selama belum disetujui/ditolak)
export async function cancelLeaveRequest(id: string): Promise<ActionResult> {
  const { db, employee } = await currentEmployee()

  const [request] = await db.select().from(schema.leave_requests)
    .where(and(eq(schema.leave_requests.id, id), eq(schema.leave_requests.employee_id, employee.id))).limit(1)
  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  if (!PENDING.includes(request.status as LeaveStatus)) return { error: 'Pengajuan sudah diproses, tidak dapat dibatalkan' }

  // Hanya hapus jika masih pending (cegah balapan dengan approval)
  await db.delete(schema.leave_requests).where(and(
    eq(schema.leave_requests.id, id),
    eq(schema.leave_requests.employee_id, employee.id),
    inArray(schema.leave_requests.status, PENDING),
  ))

  const prefix = `/storage/leave_attachments/${employee.id}/`
  if (request.attachment_url?.startsWith(prefix)) {
    await deleteFromStorage(request.attachment_url.slice('/storage/'.length)).catch((e) => console.error('Failed to delete attachment', e))
  }

  revalidatePath('/employee/cuti')
  return {}
}

// 5. Pengajuan bawahan yang menunggu persetujuan atasan langsung
export async function getManagerApprovals(): Promise<LeaveRequest[]> {
  const { db, employee: manager } = await currentEmployee()

  const rows = await db
    .select({ req: schema.leave_requests, name: schema.employees.name, dept: schema.employees.dept, title: schema.employees.title })
    .from(schema.leave_requests)
    .innerJoin(schema.employees, eq(schema.leave_requests.employee_id, schema.employees.id))
    .where(and(eq(schema.employees.manager_id, manager.id), eq(schema.leave_requests.status, 'PENDING_DIRECT_MANAGER')))
    .orderBy(asc(schema.leave_requests.created_at))

  return rows.map((r) => toRequest(r.req, { employee_name: r.name ?? undefined, employees: { name: r.name, dept: r.dept, title: r.title } } as any))
}

// 6. Persetujuan / penolakan oleh atasan langsung
export async function approveByManager(id: string, isApproved: boolean, notes: string): Promise<ActionResult> {
  const { db, employee: manager } = await currentEmployee()
  const cleanNotes = (notes ?? '').trim().slice(0, NOTES_MAX)

  const [request] = await db.select().from(schema.leave_requests).where(eq(schema.leave_requests.id, id)).limit(1)
  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  if (request.status !== 'PENDING_DIRECT_MANAGER') return { error: 'Pengajuan ini sudah diproses' }
  if (request.employee_id === manager.id) return { error: 'Anda tidak dapat menyetujui pengajuan sendiri' }

  const [sub] = await db.select({ manager_id: schema.employees.manager_id }).from(schema.employees).where(eq(schema.employees.id, request.employee_id ?? '')).limit(1)
  if (!sub || sub.manager_id !== manager.id) return { error: 'Anda tidak memiliki wewenang untuk menyetujui pengajuan ini' }

  await db.update(schema.leave_requests).set({
    status: isApproved ? 'PENDING_HC_ADMIN' : 'REJECTED',
    manager_approved_by: manager.id,
    manager_approved_at: new Date().toISOString(),
    manager_notes: cleanNotes,
    updated_at: new Date().toISOString(),
  }).where(and(eq(schema.leave_requests.id, id), eq(schema.leave_requests.status, 'PENDING_DIRECT_MANAGER')))

  revalidatePath('/employee/cuti')
  return {}
}

// 7. Pengajuan yang menunggu persetujuan final HC Admin
export async function getHCAdminApprovals(): Promise<LeaveRequest[]> {
  const admin = await getAdminContext()
  if (!admin) throw new Error('Unauthorized')
  return listAdminRequests({ pendingOnly: true })
}

/** Daftar pengajuan untuk admin (menunggu HC, atau seluruh riwayat). */
export async function listAdminRequests(opts: { pendingOnly?: boolean } = {}): Promise<LeaveRequest[]> {
  const admin = await getAdminContext()
  if (!admin) throw new Error('Unauthorized')
  const db = getDb()

  const rows = await db
    .select({ req: schema.leave_requests, name: schema.employees.name, dept: schema.employees.dept, title: schema.employees.title })
    .from(schema.leave_requests)
    .leftJoin(schema.employees, eq(schema.leave_requests.employee_id, schema.employees.id))
    .where(opts.pendingOnly ? eq(schema.leave_requests.status, 'PENDING_HC_ADMIN') : undefined)
    .orderBy(opts.pendingOnly ? asc(schema.leave_requests.created_at) : desc(schema.leave_requests.created_at))
    .limit(500)

  return rows.map((r) => toRequest(r.req, { employee_name: r.name ?? 'Unknown', employees: { name: r.name, dept: r.dept, title: r.title } } as any))
}

// 8. Persetujuan / penolakan final oleh HC Admin
export async function approveByHC(id: string, isApproved: boolean, notes: string): Promise<ActionResult> {
  const admin = await getAdminContext()
  if (!admin) return { error: 'Unauthorized' }
  const db = getDb()
  const cleanNotes = (notes ?? '').trim().slice(0, NOTES_MAX)

  const [request] = await db.select().from(schema.leave_requests).where(eq(schema.leave_requests.id, id)).limit(1)
  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  if (request.status !== 'PENDING_HC_ADMIN') return { error: 'Pengajuan ini sudah diproses atau belum sampai tahap HC' }
  if (request.employee_id === admin.emp.id) return { error: 'Anda tidak dapat menyetujui pengajuan sendiri' }

  if (isApproved) {
    // Pastikan kuota masih cukup saat disetujui (jatah bisa berubah sejak pengajuan dibuat)
    const [owner] = await db.select().from(schema.employees).where(eq(schema.employees.id, request.employee_id ?? '')).limit(1)
    if (!owner) return { error: 'Karyawan pengaju tidak ditemukan' }
    const balances = await getLeaveBalances(db, owner, Number((request.start_date ?? '').slice(0, 4)))
    const b = balances.find((x) => x.type === request.leave_type)
    // `remaining` sudah memotong pengajuan ini (statusnya pending), jadi cukup cek tidak negatif
    if (b && b.remaining !== null && b.remaining < 0) {
      return { error: `Kuota ${request.leave_type} karyawan tidak mencukupi. Ubah jatah di menu Kuota Cuti atau tolak pengajuan.` }
    }
  }

  await db.update(schema.leave_requests).set({
    status: isApproved ? 'APPROVED' : 'REJECTED',
    hc_approved_by: admin.emp.id,
    hc_approved_at: new Date().toISOString(),
    hc_notes: cleanNotes,
    updated_at: new Date().toISOString(),
  }).where(and(eq(schema.leave_requests.id, id), eq(schema.leave_requests.status, 'PENDING_HC_ADMIN')))

  revalidatePath('/employee/cuti')
  revalidatePath('/admin/leave-requests')
  return {}
}

// 9. Cuti APPROVED rekan satu departemen (Kalender Tim)
export async function getTeamApprovedLeaves(): Promise<LeaveRequest[]> {
  const { db, employee } = await currentEmployee()
  if (!employee.dept) return []

  const rows = await db
    .select({ req: schema.leave_requests, name: schema.employees.name, dept: schema.employees.dept })
    .from(schema.leave_requests)
    .innerJoin(schema.employees, eq(schema.leave_requests.employee_id, schema.employees.id))
    .where(and(eq(schema.leave_requests.status, 'APPROVED'), eq(schema.employees.dept, employee.dept)))
    .orderBy(asc(schema.leave_requests.start_date))

  return rows.map((r) => toRequest(r.req, { employee_name: r.name ?? undefined, employees: { name: r.name, dept: r.dept } } as any))
}

// 10. Daftar hari libur (untuk keterangan & perhitungan di form pengajuan)
export async function getHolidays(): Promise<{ date: string; name: string; type: string }[]> {
  const { db } = await currentEmployee()
  const year = new Date().getUTCFullYear()
  return db
    .select({ date: schema.holidays.date, name: schema.holidays.name, type: schema.holidays.type })
    .from(schema.holidays)
    .where(and(gte(schema.holidays.date, `${year - 1}-01-01`), lte(schema.holidays.date, `${year + 2}-12-31`)))
    .orderBy(asc(schema.holidays.date))
}
