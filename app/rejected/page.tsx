import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import RejectedClient from './RejectedClient'

export default async function RejectedPage() {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const userName = session.user.name || session.user.email.split('@')[0] || 'Pengguna'

  return <RejectedClient userName={userName} userEmail={session.user.email} />
}
