import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import PendingApprovalClient from './PendingApprovalClient'

export default async function PendingApprovalPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  // Re-check status live — in case user refreshes after being approved
  const db = getDb()
  const userEmail = session.user.email.toLowerCase().trim()
  const empRecords = await db.select().from(schema.employees)
  const emp = empRecords.find(e => (e.email || '').toLowerCase().trim() === userEmail)

  const status = emp?.approval_status || 'Pending'

  if (status === 'Approved') redirect('/employee/dashboard')
  if (status === 'Rejected') redirect('/rejected')

  const userName = emp?.name || session.user.name || session.user.email.split('@')[0] || 'Pengguna'

  return <PendingApprovalClient userName={userName} userEmail={session.user.email} />
}
