'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword, validateNewPassword } from '@/lib/password'

export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
  const session = await auth()
  const employeeId = session?.user?.id
  if (!employeeId) return { error: 'Not authenticated' }

  const invalid = validateNewPassword(newPassword)
  if (invalid) return { error: invalid }

  const db = getDb()
  const [cred] = await db.select().from(schema.employee_credentials).where(eq(schema.employee_credentials.employee_id, employeeId)).limit(1)
  if (!(await verifyPassword(currentPassword, cred?.password_hash ?? null))) return { error: 'Password saat ini salah' }
  if (currentPassword === newPassword) return { error: 'Password baru harus berbeda dari password saat ini' }

  const patch = {
    password_hash: await hashPassword(newPassword),
    password_changed_at: new Date().toISOString(),
    failed_attempts: 0,
    locked_until: null,
  }
  if (cred) await db.update(schema.employee_credentials).set(patch).where(eq(schema.employee_credentials.employee_id, employeeId))
  else await db.insert(schema.employee_credentials).values({ employee_id: employeeId, ...patch })

  // Token lama (termasuk sesi ini) tidak berlaku lagi; klien harus login ulang.
  return {}
}
