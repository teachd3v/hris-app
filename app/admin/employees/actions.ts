'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/** Kembalikan password karyawan ke password default dan buka kunci akun. Sesi aktifnya ikut dicabut. */
export async function resetEmployeePassword(employeeId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const db = getDb()

  const [emp] = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!emp) return { error: 'Karyawan tidak ditemukan' }

  const patch = {
    password_hash: null,
    password_changed_at: new Date().toISOString(),
    failed_attempts: 0,
    locked_until: null,
  }
  const [cred] = await db.select({ id: schema.employee_credentials.employee_id }).from(schema.employee_credentials).where(eq(schema.employee_credentials.employee_id, employeeId)).limit(1)
  if (cred) await db.update(schema.employee_credentials).set(patch).where(eq(schema.employee_credentials.employee_id, employeeId))
  else await db.insert(schema.employee_credentials).values({ employee_id: employeeId, ...patch })

  return {}
}
