'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, or, sql, and, ne } from 'drizzle-orm'
import { verifyPassword } from '@/lib/password'
import { deleteStoragePrefix } from '@/lib/storage'
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

const STORAGE_PREFIXES = ['avatars', 'documents', 'attendances', 'leave_attachments']

/**
 * Hapus akun karyawan beserta seluruh datanya (profil, presensi, cuti, asesmen, dokumen, file R2).
 * Perlu konfirmasi ulang: email karyawan diketik persis + password admin yang sedang login.
 */
export async function deleteEmployee(
  employeeId: string,
  confirmEmail: string,
  adminPassword: string,
): Promise<{ error?: string }> {
  const { profile: admin } = await requireAdmin()
  if (!admin) return { error: 'Not authenticated' }
  if (admin.id === employeeId) return { error: 'Anda tidak dapat menghapus akun Anda sendiri' }

  const db = getDb()
  const [target] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!target) return { error: 'Karyawan tidak ditemukan' }

  const expected = (target.email || target.institutional_email || '').trim().toLowerCase()
  if (!expected || confirmEmail.trim().toLowerCase() !== expected) {
    return { error: 'Email konfirmasi tidak sesuai' }
  }

  const [adminCred] = await db.select({ hash: schema.employee_credentials.password_hash }).from(schema.employee_credentials).where(eq(schema.employee_credentials.employee_id, admin.id)).limit(1)
  if (!(await verifyPassword(adminPassword, adminCred?.hash ?? null))) return { error: 'Password Anda salah' }

  if (target.role === 'Admin') {
    const others = await db.select({ id: schema.employees.id }).from(schema.employees).where(and(eq(schema.employees.role, 'Admin'), ne(schema.employees.id, employeeId))).limit(1)
    if (others.length === 0) return { error: 'Tidak dapat menghapus admin terakhir' }
  }

  const byEmployee = [
    schema.achievements, schema.attendances, schema.career_interests, schema.committee_experiences,
    schema.educations, schema.emergency_contacts, schema.employee_assessments, schema.employee_documents,
    schema.family_members, schema.languages, schema.non_formal_educations, schema.org_experiences,
    schema.promotion_histories, schema.skills, schema.social_activities, schema.trainings,
    schema.work_experiences, schema.leave_requests,
  ].map((t) => db.delete(t).where(eq(t.employee_id, employeeId)))

  await db.batch([
    ...byEmployee,
    db.delete(schema.employee_credentials).where(eq(schema.employee_credentials.employee_id, employeeId)),
    // Bawahan yang atasannya dihapus tidak lagi punya atasan
    db.update(schema.employees).set({ manager_id: null }).where(eq(schema.employees.manager_id, employeeId)),
    db.delete(schema.employees).where(eq(schema.employees.id, employeeId)),
  ] as any)

  // Bersihkan file R2 (best effort: data DB sudah terhapus)
  for (const prefix of STORAGE_PREFIXES) {
    try {
      await deleteStoragePrefix(`${prefix}/${employeeId}/`)
    } catch (e) {
      console.error(`Failed to delete storage ${prefix}/${employeeId}/`, e)
    }
  }

  revalidatePath('/admin/employees')
  return {}
}
