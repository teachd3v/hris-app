import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const ADMIN_EMAILS = ['teachgen2025@gmail.com', 'teach.d3v@gmail.com']

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const db = getDb()
  const empRecords = await db.select({ role: schema.employees.role, name: schema.employees.name, photo_url: schema.employees.photo_url }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  
  const profile = empRecords.length > 0 ? empRecords[0] : null
  const isAdmin = profile?.role === 'Admin' || ADMIN_EMAILS.includes(session.user.email)
  if (!isAdmin) redirect('/employee/dashboard')

  return { user: session.user, profile }
}
