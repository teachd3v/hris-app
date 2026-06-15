import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GridDashboardClient from './GridDashboardClient'

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('name, photo_url, title')
    .eq('id', user.id)
    .single()

  const name = employee?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  
  const { data: latestAttendance } = await (supabase as any)
    .from('attendances')
    .select('clock_in, clock_out, date, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() as any
    
  // Simple check if it's today in local time
  const isToday = latestAttendance?.date === new Date().toISOString().split('T')[0] || 
                  latestAttendance?.date === new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <GridDashboardClient 
      userName={name} 
      userInitials={initials}
      userPhoto={employee?.photo_url || undefined}
      userTitle={employee?.title || 'Karyawan'}
      todayAttendance={isToday ? {
        clockIn: latestAttendance.clock_in,
        clockOut: latestAttendance.clock_out,
        clockInLat: latestAttendance.clock_in_lat,
        clockInLng: latestAttendance.clock_in_lng,
        clockOutLat: latestAttendance.clock_out_lat,
        clockOutLng: latestAttendance.clock_out_lng
      } : undefined}
    />
  )
}
