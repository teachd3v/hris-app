// Notifikasi di dalam aplikasi. Pernyataan INSERT/UPDATE dikembalikan agar ikut db.batch([...aksi, ...notifyStmts()]),
// sehingga notifikasi dan perubahan datanya atomik (sama seperti log audit). Fungsi plan* murni, tanpa akses database.
import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { isAdminEmployee } from '@/lib/admins'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>

export type NotificationType =
  | 'leave.submitted' // pengajuan baru (atasan: perlu aksi; admin: pemberitahuan)
  | 'leave.manager_approved' // disetujui atasan (admin: perlu aksi HC; karyawan: pemberitahuan)
  | 'leave.manager_rejected'
  | 'leave.hc_approved'
  | 'leave.hc_rejected'
  | 'leave.hc_override'

export interface NotifyInput {
  employeeId: string
  type: NotificationType
  title: string
  body?: string | null
  href?: string | null
  entityId?: string | null
}

/** Notifikasi "perlu aksi" yang dianggap selesai begitu pengajuan diputuskan atau dibatalkan. */
export const ACTIONABLE_TYPES: NotificationType[] = ['leave.submitted', 'leave.manager_approved']

const HREF = {
  approver: '/employee/persetujuan',
  admin: '/admin/m/cuti',
  mine: '/employee/cuti',
} as const

const shortDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "Cuti Tahunan · 3 hari (12 Nov – 14 Nov)". Alasan pengajuan sengaja tidak ikut (bisa berisi data sensitif). */
export function leaveBrief(type: string, start: string, end: string, days: unknown): string {
  const n = Number(days) || 0
  const range = start === end ? shortDate(start) : `${shortDate(start)} – ${shortDate(end)}`
  return `${type} · ${n} hari (${range})`
}

export interface LeaveRef {
  requestId: string
  requesterId: string
  requesterName: string
  brief: string
}

/** Pengajuan baru: atasan langsung (perlu aksi) dan semua admin (pemberitahuan; pucuk pimpinan langsung perlu aksi HC). */
export function planSubmitted(ref: LeaveRef & { managerId: string | null; managerName: string | null; adminIds: string[] }): NotifyInput[] {
  const title = `Pengajuan cuti baru dari ${ref.requesterName}`
  const out: NotifyInput[] = []
  const hasManager = Boolean(ref.managerId) && ref.managerId !== ref.requesterId
  if (hasManager) {
    out.push({ employeeId: ref.managerId!, type: 'leave.submitted', title, body: `${ref.brief}. Menunggu persetujuan Anda.`, href: HREF.approver, entityId: ref.requestId })
  }
  for (const id of ref.adminIds) {
    if (id === ref.requesterId || (hasManager && id === ref.managerId)) continue
    out.push({
      employeeId: id, type: 'leave.submitted', title,
      body: hasManager ? `${ref.brief}. Menunggu atasan${ref.managerName ? ` (${ref.managerName})` : ''}.` : `${ref.brief}. Menunggu persetujuan HC.`,
      href: HREF.admin, entityId: ref.requestId,
    })
  }
  return out
}

/** Keputusan atasan: karyawan diberi tahu; bila disetujui, semua admin (kecuali pelaku dan pengaju) diminta memproses. */
export function planManagerDecision(ref: LeaveRef & { actorId: string; approved: boolean; adminIds: string[] }): NotifyInput[] {
  const out: NotifyInput[] = [{
    employeeId: ref.requesterId,
    type: ref.approved ? 'leave.manager_approved' : 'leave.manager_rejected',
    title: ref.approved ? 'Pengajuan cuti disetujui atasan' : 'Pengajuan cuti ditolak atasan',
    body: ref.approved ? `${ref.brief}. Menunggu persetujuan HC.` : ref.brief,
    href: HREF.mine, entityId: ref.requestId,
  }]
  if (ref.approved) {
    for (const id of ref.adminIds) {
      if (id === ref.requesterId || id === ref.actorId) continue
      out.push({ employeeId: id, type: 'leave.manager_approved', title: 'Pengajuan cuti menunggu persetujuan HC', body: `${ref.requesterName}: ${ref.brief}. Sudah disetujui atasan.`, href: HREF.admin, entityId: ref.requestId })
    }
  }
  return out
}

/** Keputusan akhir HC: karyawan diberi tahu. */
export function planHcDecision(ref: LeaveRef & { approved: boolean }): NotifyInput[] {
  return [{
    employeeId: ref.requesterId,
    type: ref.approved ? 'leave.hc_approved' : 'leave.hc_rejected',
    title: ref.approved ? 'Pengajuan cuti disetujui' : 'Pengajuan cuti ditolak',
    body: ref.brief, href: HREF.mine, entityId: ref.requestId,
  }]
}

/** HC mengambil alih pengajuan yang tertahan di atasan: karyawan dan atasan yang menahan diberi tahu. */
export function planOverride(ref: LeaveRef & { actorId: string; approved: boolean; managerId: string | null }): NotifyInput[] {
  const out: NotifyInput[] = [{
    employeeId: ref.requesterId, type: 'leave.hc_override',
    title: ref.approved ? 'Pengajuan cuti disetujui HC' : 'Pengajuan cuti ditolak HC',
    body: `${ref.brief}. Diputuskan langsung oleh HC.`, href: HREF.mine, entityId: ref.requestId,
  }]
  if (ref.managerId && ref.managerId !== ref.actorId && ref.managerId !== ref.requesterId) {
    out.push({ employeeId: ref.managerId, type: 'leave.hc_override', title: 'Pengajuan bawahan diputuskan HC', body: `${ref.requesterName}: ${ref.brief}.`, href: HREF.approver, entityId: ref.requestId })
  }
  return out
}

/** Satu baris per (penerima, jenis, pengajuan); di-chunk karena D1 membatasi jumlah parameter per pernyataan. */
export function notifyStmts(db: Db, items: NotifyInput[]) {
  const seen = new Set<string>()
  const now = new Date().toISOString()
  const rows: (typeof schema.notifications.$inferInsert)[] = []
  for (const i of items) {
    const key = `${i.employeeId}|${i.type}|${i.entityId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ id: crypto.randomUUID(), employee_id: i.employeeId, type: i.type, title: i.title, body: i.body ?? null, href: i.href ?? null, entity_id: i.entityId ?? null, created_at: now })
  }
  const stmts = []
  for (let n = 0; n < rows.length; n += 10) stmts.push(db.insert(schema.notifications).values(rows.slice(n, n + 10)))
  return stmts
}

/**
 * Tandai selesai notifikasi "perlu aksi" untuk satu pengajuan (sudah diputuskan/dibatalkan).
 * `exceptEmployeeId`: penerima yang dikecualikan (mis. pengaju, yang notifikasinya hanya pemberitahuan).
 * Letakkan SEBELUM notifyStmts di batch supaya notifikasi baru tidak ikut tertandai.
 */
export function resolveStmt(db: Db, entityId: string, opts: { exceptEmployeeId?: string } = {}) {
  return db.update(schema.notifications).set({ read_at: new Date().toISOString() }).where(and(
    eq(schema.notifications.entity_id, entityId),
    isNull(schema.notifications.read_at),
    inArray(schema.notifications.type, ACTIONABLE_TYPES),
    opts.exceptEmployeeId ? ne(schema.notifications.employee_id, opts.exceptEmployeeId) : undefined,
  ))
}

/** Id semua akun admin aktif (kolom role Admin atau email di daftar admin, termasuk super admin). */
export async function adminRecipientIds(db: Db): Promise<string[]> {
  const rows = await db
    .select({ id: schema.employees.id, role: schema.employees.role, email: schema.employees.email, institutional_email: schema.employees.institutional_email, approval_status: schema.employees.approval_status })
    .from(schema.employees)
  return rows.filter((e) => (e.approval_status || 'Approved') === 'Approved' && isAdminEmployee(e)).map((e) => e.id)
}
