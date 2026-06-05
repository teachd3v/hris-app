import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = ['teachgen2025@gmail.com', 'teach.d3v@gmail.com']

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('employees')
    .select('role, name, photo_url')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'Admin' || ADMIN_EMAILS.includes(user.email ?? '')
  if (!isAdmin) redirect('/employee/dashboard')

  return { user, profile }
}
