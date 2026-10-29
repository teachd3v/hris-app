'use server'

import { getAdminContext } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getLeaveBalances, type LeaveBalance } from '@/lib/leave-balance'
import { LEAVE_TYPE_KEYS } from '@/lib/leave'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAdminAction() {
  const admin = await getAdminContext()
  if (!admin) throw new Error('Unauthorized')
  return getDb()
}

const validYear = (y: number) => Number.isInteger(y) && y >= 2020 && y <= 2100

export interface QuotaEmployee {
  id: string
  name: string | null
  email: string | null
  dept: string | null
  title: string | null
  customCount: number
}

export async function getQuotaEmployees(year: number): Promise<QuotaEmployee[]> {
  const db = await requireAdminAction()
  if (!validYear(year)) return []

  const [emps, counts] = await Promise.all([
    db.select({ id: schema.employees.id, name: schema.employees.name, email: schema.employees.email, dept: schema.employees.dept, title: schema.employees.title })
      .from(schema.employees)
      .orderBy(schema.employees.name),
    db.select({ id: schema.leave_quotas.employee_id, n: sql<number>`count(*)` })
      .from(schema.leave_quotas)
      .where(eq(schema.leave_quotas.year, year))
      .groupBy(schema.leave_quotas.employee_id),
  ])
  const byId = new Map(counts.map((c) => [c.id, Number(c.n)]))
  return emps.map((e) => ({ ...e, customCount: byId.get(e.id) ?? 0 }))
}

export async function getEmployeeBalances(employeeId: string, year: number): Promise<LeaveBalance[]> {
  const db = await requireAdminAction()
  if (!validYear(year)) return []
  const [emp] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!emp) return []
  return getLeaveBalances(db, emp, year)
}

/** quotas[jenis] = angka (jatah khusus) atau null (hapus jatah khusus -> kembali ke default). */
export async function saveEmployeeQuotas(
  employeeId: string,
  year: number,
  quotas: Record<string, number | null>,
): Promise<{ error?: string }> {
  const db = await requireAdminAction()
  if (!validYear(year)) return { error: 'Tahun tidak valid' }

  const [emp] = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!emp) return { error: 'Karyawan tidak ditemukan' }

  const upserts: { type: string; quota: number }[] = []
  const clears: string[] = []
  for (const [type, value] of Object.entries(quotas)) {
    if (!LEAVE_TYPE_KEYS.includes(type as never)) return { error: `Jenis cuti tidak valid: ${type}` }
    if (value === null) {
      clears.push(type)
      continue
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 366 || (value * 2) % 1 !== 0) {
      return { error: `Jatah ${type} harus 0–366 dalam kelipatan 0,5 hari` }
    }
    upserts.push({ type, quota: value })
  }

  const now = new Date().toISOString()
  const statements: any[] = []
  if (clears.length > 0) {
    statements.push(db.delete(schema.leave_quotas).where(and(
      eq(schema.leave_quotas.employee_id, employeeId),
      eq(schema.leave_quotas.year, year),
      inArray(schema.leave_quotas.leave_type, clears),
    )))
  }
  for (const u of upserts) {
    statements.push(db.insert(schema.leave_quotas)
      .values({ employee_id: employeeId, leave_type: u.type, year, quota: String(u.quota), updated_at: now })
      .onConflictDoUpdate({
        target: [schema.leave_quotas.employee_id, schema.leave_quotas.leave_type, schema.leave_quotas.year],
        set: { quota: String(u.quota), updated_at: now },
      }))
  }
  if (statements.length > 0) await db.batch(statements as any)

  revalidatePath('/employee/cuti')
  return {}
}
