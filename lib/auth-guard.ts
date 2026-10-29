import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const ADMIN_EMAILS = [
  'teachgen2025@gmail.com',
  'teach.d3v@gmail.com',
  'hudagraph@gmail.com',
  'n.widodo@dompetdhuafa.org',
  'zulfa.nur@dompetdhuafa.org',
  'haryo@dompetdhuafa.org',
]

/** approval_status kosong = akun lama, dianggap sudah disetujui. */
export function approvalOf(emp: { approval_status: string | null }) {
  return emp.approval_status || 'Approved'
}

async function getSessionEmployee() {
  const session = await auth()
  const employeeId = session?.user?.id
  if (!session?.user?.email || !employeeId) redirect('/')

  const db = getDb()
  const [emp] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!emp) redirect('/')
  return { user: session.user, emp }
}

/**
 * Used by the profile page itself.
 * Only checks auth + approval status, NOT profile_completed
 * (to avoid redirect loop when user is on the profile page filling in data).
 */
export async function requireApprovedUserForProfile() {
  const { user, emp } = await getSessionEmployee()
  const status = approvalOf(emp)
  if (status === 'Pending') redirect('/pending-approval')
  if (status === 'Rejected') redirect('/rejected')
  return { user, profile: emp }
}

/**
 * Used by all other employee pages.
 * Checks auth + approval + profile_completed.
 * If profile not completed → forces user to /employee/profile first.
 */
export async function requireApprovedUser() {
  const { user, emp } = await getSessionEmployee()
  const status = approvalOf(emp)
  if (status === 'Pending') redirect('/pending-approval')
  if (status === 'Rejected') redirect('/rejected')

  // Approved but profile not yet completed → force to profile page
  if (!emp.profile_completed) redirect('/employee/profile')

  return { user, profile: emp }
}

/** Konteks admin untuk server action: null jika belum login / bukan admin (tanpa redirect). */
export async function getAdminContext() {
  const session = await auth()
  const employeeId = session?.user?.id
  if (!session?.user?.email || !employeeId) return null

  const db = getDb()
  const [emp] = await db.select().from(schema.employees).where(eq(schema.employees.id, employeeId)).limit(1)
  if (!emp) return null

  const emails = [emp.email, emp.institutional_email, session.user.email].map((e) => (e || '').toLowerCase())
  const isAdmin = emp.role === 'Admin' || ADMIN_EMAILS.some((a) => emails.includes(a.toLowerCase()))
  return isAdmin ? { user: session.user, emp } : null
}

export async function requireAdmin() {
  const ctx = await getAdminContext()
  if (!ctx) {
    const session = await auth()
    redirect(session?.user?.id ? '/employee/dashboard' : '/')
  }
  const { user, emp } = ctx

  return {
    user,
    profile: { id: emp.id, role: emp.role, name: emp.name, photo_url: emp.photo_url, email: emp.email, approval_status: emp.approval_status },
  }
}
