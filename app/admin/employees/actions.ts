'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeApprovalStatus(
  employeeId: string,
  approvalStatus: 'Approved' | 'Rejected' | 'Pending',
  role?: 'Karyawan' | 'Admin'
) {
  await requireAdmin()
  const db = getDb()

  const updates: Record<string, any> = {
    approval_status: approvalStatus,
    updated_at: new Date().toISOString(),
  }
  if (role) updates.role = role

  await db
    .update(schema.employees)
    .set(updates)
    .where(eq(schema.employees.id, employeeId))

  revalidatePath('/admin/employees')
}

/** Admin membuat akun karyawan baru: langsung Approved, password default berlaku. */
export async function createEmployee(input: {
  name: string
  email: string
  role: 'Karyawan' | 'Admin'
}): Promise<{ error?: string; id?: string }> {
  await requireAdmin()

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) return { error: 'Nama wajib diisi' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Format email tidak valid' }
  if (input.role !== 'Karyawan' && input.role !== 'Admin') return { error: 'Role tidak valid' }

  const db = getDb()
  const existing = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(or(sql`lower(${schema.employees.email}) = ${email}`, sql`lower(${schema.employees.institutional_email}) = ${email}`))
    .limit(1)
  if (existing.length > 0) return { error: 'Email sudah terdaftar' }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  await db.insert(schema.employees).values({
    id,
    name,
    email,
    role: input.role,
    approval_status: 'Approved',
    profile_completed: 0,
    created_at: now,
    updated_at: now,
  })

  revalidatePath('/admin/employees')
  return { id }
}

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
