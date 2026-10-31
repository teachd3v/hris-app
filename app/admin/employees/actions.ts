'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, or, sql, and, ne } from 'drizzle-orm'
import { verifyPassword } from '@/lib/password'
import { isTopLeader, normalizeName } from '@/lib/org'
import { isAdminEmployee, isSuperAdminEmployee } from '@/lib/admins'
import { deleteStoragePrefix } from '@/lib/storage'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeApprovalStatus(
  employeeId: string,
  approvalStatus: 'Approved' | 'Rejected' | 'Pending',
  role?: 'Karyawan' | 'Admin'
): Promise<{ error?: string }> {
  const { isSuperAdmin } = await requireAdmin()
  const db = getDb()

  const [target] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!target) return { error: 'Karyawan tidak ditemukan' }

  // Akun admin hanya boleh dikelola super admin; memberi/mencabut peran Admin juga hanya super admin
  if (!isSuperAdmin && (isAdminEmployee(target) || role === 'Admin')) {
    return { error: 'Hanya super admin yang dapat mengelola akun atau peran admin' }
  }
  if (role && role !== 'Karyawan' && role !== 'Admin') return { error: 'Role tidak valid' }
  if (isSuperAdminEmployee(target) && (approvalStatus !== 'Approved' || (role && role !== 'Admin'))) {
    return { error: 'Akun super admin tidak dapat diubah' }
  }

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
  return {}
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
  const { isSuperAdmin } = await requireAdmin()
  const db = getDb()

  const [emp] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!emp) return { error: 'Karyawan tidak ditemukan' }
  if (isSuperAdminEmployee(emp)) return { error: 'Password super admin hanya dapat diubah oleh pemiliknya sendiri' }
  if (!isSuperAdmin && isAdminEmployee(emp)) return { error: 'Hanya super admin yang dapat mereset password admin' }

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
  const { profile: admin, isSuperAdmin } = await requireAdmin()
  if (!admin) return { error: 'Not authenticated' }
  if (admin.id === employeeId) return { error: 'Anda tidak dapat menghapus akun Anda sendiri' }

  const db = getDb()
  const [target] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!target) return { error: 'Karyawan tidak ditemukan' }

  if (isSuperAdminEmployee(target)) return { error: 'Akun super admin tidak dapat dihapus' }
  if (!isSuperAdmin && isAdminEmployee(target)) return { error: 'Hanya super admin yang dapat menghapus akun admin' }

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

  try {
    const byEmployee = [
      schema.achievements, schema.attendances, schema.career_interests, schema.committee_experiences,
      schema.educations, schema.emergency_contacts, schema.employee_assessments, schema.employee_documents,
      schema.family_members, schema.languages, schema.non_formal_educations, schema.org_experiences,
      schema.promotion_histories, schema.skills, schema.social_activities, schema.trainings,
      schema.work_experiences, schema.leave_requests,
    ].map((t) => db.delete(t).where(eq(t.employee_id, employeeId)))

    await db.batch([
      ...byEmployee,
    db.delete(schema.leave_quotas).where(eq(schema.leave_quotas.employee_id, employeeId)),
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
  } catch (e) {
    console.error('deleteEmployee failed', e)
    return { error: `Gagal menghapus akun: ${e instanceof Error ? e.message : 'kesalahan tidak dikenal'}` }
  }

  // Tanpa revalidatePath: halaman detail yang sedang dibuka sudah tidak punya data (notFound),
  // klien yang mengalihkan ke daftar dan me-refresh.
  return {}
}

type OrgNode = { id: string; manager_id: string | null }

/** Apakah menjadikan managerId sebagai atasan employeeId akan membentuk rantai melingkar? */
function createsCycle(nodes: Map<string, OrgNode>, employeeId: string, managerId: string) {
  let cur: string | null = managerId
  for (let i = 0; cur && i < 1000; i++) {
    if (cur === employeeId) return true
    cur = nodes.get(cur)?.manager_id ?? null
  }
  return false
}

/** Tetapkan atasan langsung. Semua karyawan wajib punya atasan kecuali pucuk pimpinan. */
export async function setEmployeeManager(employeeId: string, managerId: string | null): Promise<{ error?: string }> {
  await requireAdmin()
  const db = getDb()

  const all = await db
    .select({ id: schema.employees.id, name: schema.employees.name, email: schema.employees.email, institutional_email: schema.employees.institutional_email, manager_id: schema.employees.manager_id })
    .from(schema.employees)
  const target = all.find((e) => e.id === employeeId)
  if (!target) return { error: 'Karyawan tidak ditemukan' }

  if (isTopLeader(target)) {
    if (managerId) return { error: 'Pucuk pimpinan tidak memiliki atasan' }
    await db.update(schema.employees).set({ manager_id: null, manager: null, updated_at: new Date().toISOString() }).where(eq(schema.employees.id, employeeId))
    revalidatePath('/admin/employees')
    return {}
  }

  if (!managerId) return { error: 'Atasan langsung wajib diisi' }
  if (managerId === employeeId) return { error: 'Karyawan tidak bisa menjadi atasan dirinya sendiri' }
  const manager = all.find((e) => e.id === managerId)
  if (!manager) return { error: 'Atasan tidak ditemukan' }
  if (createsCycle(new Map(all.map((e) => [e.id, e])), employeeId, managerId)) {
    return { error: `${manager.name} sudah berada di bawah ${target.name}; atasan tidak boleh melingkar` }
  }

  await db.update(schema.employees).set({ manager_id: managerId, manager: manager.name, updated_at: new Date().toISOString() }).where(eq(schema.employees.id, employeeId))
  revalidatePath('/admin/employees')
  return {}
}

export interface AutoMatchResult {
  matched: number
  unmatched: { id: string; name: string | null; manager: string | null; reason: string }[]
}

/** Isi manager_id dari nama atasan di kolom teks lama bila cocok persis dengan satu karyawan. */
export async function autoMatchManagers(): Promise<AutoMatchResult & { error?: string }> {
  await requireAdmin()
  const db = getDb()

  const all = await db
    .select({ id: schema.employees.id, name: schema.employees.name, email: schema.employees.email, institutional_email: schema.employees.institutional_email, manager: schema.employees.manager, manager_id: schema.employees.manager_id })
    .from(schema.employees)
  const nodes = new Map(all.map((e) => [e.id, { id: e.id, manager_id: e.manager_id as string | null }]))

  const byName = new Map<string, typeof all>()
  for (const e of all) {
    const k = normalizeName(e.name)
    if (k) byName.set(k, [...(byName.get(k) ?? []), e])
  }

  const unmatched: AutoMatchResult['unmatched'] = []
  const updates: { id: string; managerId: string; managerName: string | null }[] = []

  for (const e of all) {
    if (e.manager_id || isTopLeader(e)) continue
    const label = (e.manager || '').trim()
    if (!label || label === '-') {
      unmatched.push({ id: e.id, name: e.name, manager: null, reason: 'Nama atasan belum terisi' })
      continue
    }
    const candidates = (byName.get(normalizeName(label)) ?? []).filter((c) => c.id !== e.id)
    if (candidates.length !== 1) {
      unmatched.push({ id: e.id, name: e.name, manager: label, reason: candidates.length === 0 ? 'Tidak ada karyawan dengan nama itu' : 'Nama atasan cocok dengan lebih dari satu karyawan' })
      continue
    }
    if (createsCycle(nodes, e.id, candidates[0].id)) {
      unmatched.push({ id: e.id, name: e.name, manager: label, reason: 'Akan membentuk rantai atasan melingkar' })
      continue
    }
    nodes.get(e.id)!.manager_id = candidates[0].id
    updates.push({ id: e.id, managerId: candidates[0].id, managerName: candidates[0].name })
  }

  if (updates.length > 0) {
    const now = new Date().toISOString()
    await db.batch(updates.map((u) =>
      db.update(schema.employees).set({ manager_id: u.managerId, manager: u.managerName, updated_at: now }).where(eq(schema.employees.id, u.id)),
    ) as any)
    revalidatePath('/admin/employees')
  }
  return { matched: updates.length, unmatched }
}
