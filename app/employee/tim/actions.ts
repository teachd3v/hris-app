'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getSubordinates, hasSubordinates } from '@/lib/org-tree'
import { parseIsoDate } from '@/lib/leave'
import { todayWIB } from '@/lib/time'
import { dayStatus } from '@/lib/attendance-status'
import { and, eq, gte, lte, inArray } from 'drizzle-orm'

async function currentEmployee() {
  const session = await auth()
  const id = session?.user?.id
  if (!session?.user?.email || !id) throw new Error('Not authenticated')
  const db = getDb()
  const [me] = await db.select({ id: schema.employees.id, name: schema.employees.name, title: schema.employees.title }).from(schema.employees).where(eq(schema.employees.id, id)).limit(1)
  if (!me) throw new Error('Employee not found')
  return { db, me }
}

export interface TeamMemberInfo {
  id: string
  name: string
  title: string | null
  dept: string | null
  level: number
  managerName: string | null
}

/** Untuk menampilkan menu "Tim Saya" hanya bagi yang punya bawahan. */
export async function getHasTeam(): Promise<boolean> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return false
  return hasSubordinates(getDb(), id)
}

export async function getTeamOverview(): Promise<{ name: string | null; members: TeamMemberInfo[] }> {
  const { db, me } = await currentEmployee()
  const members = await getSubordinates(db, me.id)
  return { name: me.name, members: members.map(({ id, name, title, dept, level, managerName }) => ({ id, name, title, dept, level, managerName })) }
}

export type TeamAttendanceStatus = 'HADIR' | 'BELUM_PULANG' | 'TIDAK_CLOCK_OUT' | 'CUTI' | 'LIBUR' | 'BELUM_HADIR' | 'TIDAK_HADIR' | 'BELUM_WAKTUNYA'

export interface TeamAttendanceRow extends TeamMemberInfo {
  status: TeamAttendanceStatus
  detail: string | null // jenis cuti / nama hari libur
  clock_in: string | null
  clock_out: string | null
  duration_hours: number | null
}

/**
 * Presensi seluruh bawahan (langsung & tidak langsung) pada satu tanggal.
 * Hanya jam masuk/pulang dan status; foto dan koordinat lokasi sengaja TIDAK diambil (hanya admin).
 */
export async function getTeamAttendance(date: string): Promise<{ date: string; rows: TeamAttendanceRow[]; holiday: string | null; error?: string }> {
  const { db, me } = await currentEmployee()
  const d = parseIsoDate(date)
  if (!d) return { date, rows: [], holiday: null, error: 'Tanggal tidak valid' }

  const members = await getSubordinates(db, me.id)
  if (members.length === 0) return { date, rows: [], holiday: null }
  const ids = new Set(members.map((m) => m.id))

  // Ambil per tanggal lalu saring di memori (hindari batas parameter D1 untuk daftar id yang panjang)
  const [atts, leaves, hol] = await Promise.all([
    db.select({ employee_id: schema.attendances.employee_id, clock_in: schema.attendances.clock_in, clock_out: schema.attendances.clock_out, duration_hours: schema.attendances.duration_hours })
      .from(schema.attendances).where(eq(schema.attendances.date, date)),
    db.select({ employee_id: schema.leave_requests.employee_id, leave_type: schema.leave_requests.leave_type })
      .from(schema.leave_requests)
      .where(and(eq(schema.leave_requests.status, 'APPROVED'), lte(schema.leave_requests.start_date, date), gte(schema.leave_requests.end_date, date))),
    db.select({ name: schema.holidays.name }).from(schema.holidays).where(eq(schema.holidays.date, date)).limit(1),
  ])

  const attBy = new Map(atts.filter((a) => a.employee_id && ids.has(a.employee_id)).map((a) => [a.employee_id!, a]))
  const leaveBy = new Map(leaves.filter((l) => l.employee_id && ids.has(l.employee_id)).map((l) => [l.employee_id!, l.leave_type]))
  const holiday = hol[0]?.name ?? null
  const dow = d.getUTCDay()
  const offDay = dow === 0 || dow === 6 || Boolean(holiday)
  const today = todayWIB()

  const rows: TeamAttendanceRow[] = members.map((m) => {
    const a = attBy.get(m.id)
    const base = { id: m.id, name: m.name, title: m.title, dept: m.dept, level: m.level, managerName: m.managerName }
    const clock_in = a?.clock_in ?? null
    const clock_out = a?.clock_out ?? null
    const duration_hours = a?.duration_hours != null ? Number(a.duration_hours) : null
    const { status, detail } = dayStatus({
      date, today, offDay, offLabel: holiday ?? (dow === 0 ? 'Minggu' : 'Sabtu'),
      clockIn: a?.clock_in, clockOut: a?.clock_out, leaveType: offDay ? undefined : leaveBy.get(m.id), // cuti hanya berlaku di hari kerja
    })
    return { ...base, status, detail, clock_in, clock_out, duration_hours }
  })
  return { date, rows, holiday }
}

export interface TeamCalendarLeave {
  id: string
  employee_id: string
  name: string
  leave_type: string
  start: string
  end: string
  days: number
  pending: boolean
}

/** Cuti (disetujui dan yang masih menunggu) seluruh bawahan pada satu bulan, plus hari libur bulan itu. */
export async function getTeamCalendar(year: number, month: number): Promise<{ leaves: TeamCalendarLeave[]; holidays: { date: string; name: string; type: string }[]; error?: string }> {
  const { db, me } = await currentEmployee()
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return { leaves: [], holidays: [], error: 'Bulan tidak valid' }
  }
  const mm = String(month).padStart(2, '0')
  const from = `${year}-${mm}-01`
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const to = `${year}-${mm}-${String(last).padStart(2, '0')}`

  const members = await getSubordinates(db, me.id)
  const holidays = await db.select({ date: schema.holidays.date, name: schema.holidays.name, type: schema.holidays.type })
    .from(schema.holidays).where(and(gte(schema.holidays.date, from), lte(schema.holidays.date, to)))
  if (members.length === 0) return { leaves: [], holidays }

  const nameBy = new Map(members.map((m) => [m.id, m.name]))
  const rows = await db.select({
      id: schema.leave_requests.id, employee_id: schema.leave_requests.employee_id, leave_type: schema.leave_requests.leave_type,
      start: schema.leave_requests.start_date, end: schema.leave_requests.end_date, days: schema.leave_requests.total_days, status: schema.leave_requests.status,
    })
    .from(schema.leave_requests)
    .where(and(
      inArray(schema.leave_requests.status, ['APPROVED', 'PENDING_DIRECT_MANAGER', 'PENDING_HC_ADMIN']),
      lte(schema.leave_requests.start_date, to), gte(schema.leave_requests.end_date, from),
    ))

  const leaves: TeamCalendarLeave[] = rows
    .filter((r) => r.employee_id && nameBy.has(r.employee_id))
    .map((r) => ({
      id: r.id, employee_id: r.employee_id!, name: nameBy.get(r.employee_id!)!, leave_type: r.leave_type ?? '',
      start: r.start ?? '', end: r.end ?? '', days: Number(r.days ?? 0), pending: r.status !== 'APPROVED',
    }))
    .sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name))
  return { leaves, holidays }
}
