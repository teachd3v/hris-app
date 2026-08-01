import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { employees, attendances } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import GridDashboardClient from './GridDashboardClient'

export default async function EmployeeDashboardPage() {
  const session = await auth()
  const user = session?.user
  
  if (!user || !user.email) {
    redirect('/')
  }

  const db = getDb()
  const employeeRecords = await db.select({
    id: employees.id,
    name: employees.name,
    photo_url: employees.photo_url,
    title: employees.title
  }).from(employees).where(eq(employees.email, user.email)).limit(1)

  const employee = employeeRecords.length > 0 ? employeeRecords[0] : null
  const name = employee?.name || user.name || user.email.split('@')[0] || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  
  let latestAttendance = null;
  if (employee) {
    const attendanceRecords = await db
      .select({
        clock_in: attendances.clock_in,
        clock_out: attendances.clock_out,
        date: attendances.date,
        clock_in_lat: attendances.clock_in_lat,
        clock_in_lng: attendances.clock_in_lng,
        clock_out_lat: attendances.clock_out_lat,
        clock_out_lng: attendances.clock_out_lng
      })
      .from(attendances)
      .where(eq(attendances.employee_id, employee.id))
      .orderBy(desc(attendances.created_at))
      .limit(1)
    
    if (attendanceRecords.length > 0) {
      latestAttendance = attendanceRecords[0];
    }
  }
    
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
        clockIn: latestAttendance?.clock_in || undefined,
        clockOut: latestAttendance?.clock_out || undefined,
        clockInLat: latestAttendance?.clock_in_lat ? parseFloat(latestAttendance.clock_in_lat) : undefined,
        clockInLng: latestAttendance?.clock_in_lng ? parseFloat(latestAttendance.clock_in_lng) : undefined,
        clockOutLat: latestAttendance?.clock_out_lat ? parseFloat(latestAttendance.clock_out_lat) : undefined,
        clockOutLng: latestAttendance?.clock_out_lng ? parseFloat(latestAttendance.clock_out_lng) : undefined
      } : undefined}
    />
  )
}
