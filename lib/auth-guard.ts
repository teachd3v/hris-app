import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const ADMIN_EMAILS = [
  'teachgen2025@gmail.com',
  'teach.d3v@gmail.com',
  'hudagraph@gmail.com',
  'n.widodo@dompetdhuafa.org',
  'zulfa.nur@dompetdhuafa.org',
  'haryo@dompetdhuafa.org',
]

/**
 * Used by the profile page itself.
 * Only checks auth + approval status, NOT profile_completed
 * (to avoid redirect loop when user is on the profile page filling in data).
 */
export async function requireApprovedUserForProfile() {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const db = getDb()
  const userEmail = session.user.email.toLowerCase().trim()
  const empRecords = await db.select().from(schema.employees)
  const emp = empRecords.find(e => 
    (e.email || '').toLowerCase().trim() === userEmail ||
    (e.institutional_email || '').toLowerCase().trim() === userEmail
  )

  if (!emp) redirect('/pending-approval')

  const approvalStatus = emp.approval_status || 'Pending'
  if (approvalStatus === 'Pending') redirect('/pending-approval')
  if (approvalStatus === 'Rejected') redirect('/rejected')

  return { user: session.user, profile: emp }
}

/**
 * Used by all other employee pages.
 * Checks auth + approval + profile_completed.
 * If profile not completed → forces user to /employee/profile first.
 */
export async function requireApprovedUser() {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const db = getDb()
  const userEmail = session.user.email.toLowerCase().trim()
  const empRecords = await db.select().from(schema.employees)
  const emp = empRecords.find(e => 
    (e.email || '').toLowerCase().trim() === userEmail ||
    (e.institutional_email || '').toLowerCase().trim() === userEmail
  )

  if (!emp) {
    // New user — auto-create a pending record
    const newId = crypto.randomUUID()
    const isInstitution = userEmail.endsWith('@dompetdhuafa.org')
    await db.insert(schema.employees).values({
      id: newId,
      email: isInstitution ? null : userEmail,
      institutional_email: isInstitution ? userEmail : null,
      name: session.user.name || session.user.email.split('@')[0],
      role: 'Karyawan',
      approval_status: 'Pending',
      profile_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    redirect('/pending-approval')
  }

  const approvalStatus = emp.approval_status || 'Pending'
  if (approvalStatus === 'Pending') redirect('/pending-approval')
  if (approvalStatus === 'Rejected') redirect('/rejected')

  // Approved but profile not yet completed → force to profile page
  if (!emp.profile_completed || emp.profile_completed === 0) {
    redirect('/employee/profile')
  }

  return { user: session.user, profile: emp }
}

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const db = getDb()
  const userEmail = session.user.email.toLowerCase()
  const empRecords = await db.select({
    id: schema.employees.id,
    role: schema.employees.role,
    name: schema.employees.name,
    photo_url: schema.employees.photo_url,
    email: schema.employees.email,
    approval_status: schema.employees.approval_status,
  }).from(schema.employees)

  const profile = empRecords.find(e => (e.email || '').toLowerCase() === userEmail)
  const isAdmin = profile?.role === 'Admin' || ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail)

  if (!isAdmin) redirect('/employee/dashboard')

  return { user: session.user, profile: profile || null }
}
