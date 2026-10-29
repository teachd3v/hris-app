import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { LEAVE_TYPES, type LeaveCategory } from '@/lib/leave'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>
type EmployeeRow = typeof schema.employees.$inferSelect

export interface LeaveBalance {
  type: LeaveCategory
  /** null = tidak dibatasi */
  quota: number | null
  /** sudah disetujui */
  used: number
  /** menunggu persetujuan (sudah memotong sisa) */
  pending: number
  /** null = tidak dibatasi */
  remaining: number | null
  /** true jika admin sudah menetapkan jatah khusus */
  explicit: boolean
}

const num = (v: unknown) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0)

/**
 * Jatah per jenis cuti untuk satu karyawan pada satu tahun.
 * Default (tanpa jatah khusus): Cuti Tahunan = employees.leave_total (12), Ganti Hari = employees.leave_ganti_hari,
 * jenis lain tidak dibatasi. Pemakaian = total hari pengajuan APPROVED pada tahun itu (+ leave_used lama untuk
 * Cuti Tahunan tahun berjalan selama belum ada jatah khusus).
 */
export async function getLeaveBalances(db: Db, emp: EmployeeRow, year: number): Promise<LeaveBalance[]> {
  const [quotaRows, sums] = await Promise.all([
    db.select().from(schema.leave_quotas).where(and(eq(schema.leave_quotas.employee_id, emp.id), eq(schema.leave_quotas.year, year))),
    db
      .select({
        type: schema.leave_requests.leave_type,
        status: schema.leave_requests.status,
        days: sql<number>`coalesce(sum(cast(${schema.leave_requests.total_days} as real)), 0)`,
      })
      .from(schema.leave_requests)
      .where(
        and(
          eq(schema.leave_requests.employee_id, emp.id),
          gte(schema.leave_requests.start_date, `${year}-01-01`),
          lte(schema.leave_requests.start_date, `${year}-12-31`),
          inArray(schema.leave_requests.status, ['APPROVED', 'PENDING_DIRECT_MANAGER', 'PENDING_HC_ADMIN']),
        ),
      )
      .groupBy(schema.leave_requests.leave_type, schema.leave_requests.status),
  ])

  const explicit = new Map(quotaRows.map((r) => [r.leave_type, num(r.quota)]))
  const currentYear = new Date().getUTCFullYear()

  return LEAVE_TYPES.map(({ key }) => {
    const hasRow = explicit.has(key)
    let quota: number | null = null
    if (hasRow) quota = explicit.get(key)!
    else if (key === 'Cuti Tahunan') quota = emp.leave_total !== null ? num(emp.leave_total) : 12
    else if (key === 'Ganti Hari') quota = num(emp.leave_ganti_hari)

    let used = sums.filter((s) => s.type === key && s.status === 'APPROVED').reduce((a, s) => a + num(s.days), 0)
    if (key === 'Cuti Tahunan' && !hasRow && year === currentYear) used += num(emp.leave_used)
    const pending = sums.filter((s) => s.type === key && s.status !== 'APPROVED').reduce((a, s) => a + num(s.days), 0)

    return { type: key, quota, used, pending, remaining: quota === null ? null : quota - used - pending, explicit: hasRow }
  })
}
