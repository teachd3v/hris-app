import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { dummyUserProfile } from '@/lib/dummy-data'

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user
  
  if (!user || !user.email) {
    redirect('/')
  }

  const db = getDb()

  let employeeRecords = await db.select().from(schema.employees).where(eq(schema.employees.email, user.email)).limit(1)
  
  if (employeeRecords.length === 0) {
    // Insert new basic profile if it doesn't exist
    const newId = crypto.randomUUID();
    await db.insert(schema.employees).values({
      id: newId,
      name: user.name || user.email.split('@')[0] || 'User',
      email: user.email,
      nationality: 'Indonesia',
      religion: 'Islam',
      country: 'Indonesia',
    });
    employeeRecords = await db.select().from(schema.employees).where(eq(schema.employees.id, newId)).limit(1)
    if (employeeRecords.length === 0) {
      return <ProfileClient initialData={dummyUserProfile} />
    }
  }

  const employee = employeeRecords[0]
  const employeeId = employee.id

  const [
    family,
    emergencyContacts,
    workExperience,
    promotionHistory,
    education,
    nonFormalEducation,
    languages,
    skills,
    training,
    careerInterests,
    orgExperience,
    socialActivities,
    committeeExperience,
    achievements
  ] = await Promise.all([
    db.select().from(schema.family_members).where(eq(schema.family_members.employee_id, employeeId)),
    db.select().from(schema.emergency_contacts).where(eq(schema.emergency_contacts.employee_id, employeeId)),
    db.select().from(schema.work_experiences).where(eq(schema.work_experiences.employee_id, employeeId)),
    db.select().from(schema.promotion_histories).where(eq(schema.promotion_histories.employee_id, employeeId)),
    db.select().from(schema.educations).where(eq(schema.educations.employee_id, employeeId)),
    db.select().from(schema.non_formal_educations).where(eq(schema.non_formal_educations.employee_id, employeeId)),
    db.select().from(schema.languages).where(eq(schema.languages.employee_id, employeeId)),
    db.select().from(schema.skills).where(eq(schema.skills.employee_id, employeeId)),
    db.select().from(schema.trainings).where(eq(schema.trainings.employee_id, employeeId)),
    db.select().from(schema.career_interests).where(eq(schema.career_interests.employee_id, employeeId)),
    db.select().from(schema.org_experiences).where(eq(schema.org_experiences.employee_id, employeeId)),
    db.select().from(schema.social_activities).where(eq(schema.social_activities.employee_id, employeeId)),
    db.select().from(schema.committee_experiences).where(eq(schema.committee_experiences.employee_id, employeeId)),
    db.select().from(schema.achievements).where(eq(schema.achievements.employee_id, employeeId))
  ]);

  // Map to the shape expected by DashboardClient
  // We use the dummyUserProfile as a base to ensure all fields exist
  const mappedProfile: typeof dummyUserProfile = {
    ...dummyUserProfile,
    id: employee.id,
    employeeCode: employee.employee_code || '',
    name: employee.name || 'User',
    initials: (employee.name || '').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
    photo: employee.photo_url || undefined,
    email: employee.email || '',
    phone: employee.phone || '',
    nik: employee.nik || '',
    birth: employee.birth_date || '',
    gender: employee.gender || '',
    bloodType: employee.blood_type || '',
    nationality: employee.nationality || 'Indonesia',
    maritalStatus: employee.marital_status || '',
    religion: employee.religion || 'Islam',
    address: employee.address || '',
    ktpAddress: employee.ktp_address || '',
    city: employee.city || '',
    province: employee.province || '',
    postalCode: employee.postal_code || '',
    country: employee.country || 'Indonesia',
    
    title: employee.title || '-',
    dept: employee.dept || '-',
    level: employee.level || '-',
    status: employee.status || '-',
    join: employee.join_date || '',
    tenure: employee.tenure || '-',
    manager: employee.manager || '-',
    
    bank: employee.bank || '',
    
    leave: {
      total: employee.leave_total !== null ? Number(employee.leave_total) : 12,
      used: employee.leave_used !== null ? Number(employee.leave_used) : 0,
    },
    attendance: {
      present: employee.attendance_present || 0,
      late: employee.attendance_late || 0,
    },
    
    family: family
      .map((item: any) => ({
        id: item.id,
        relationship: item.relationship,
        name: item.name,
        birthDate: item.birth_date || '',
        occupation: item.occupation || '',
        phone: item.phone || '',
      }))
      .sort((a: any, b: any) => (b.birthDate || '').localeCompare(a.birthDate || '')),
    
    emergencyContacts: emergencyContacts.map((item: any) => ({ ...item })),
    
    workExperience: workExperience
      .map((item: any) => ({
        id: item.id,
        company: item.company,
        position: item.position,
        startDate: item.start_date || '',
        endDate: item.end_date || '',
        description: item.description || '',
      }))
      .sort((a: any, b: any) => (b.startDate || '').localeCompare(a.startDate || '')),
    
    promotionHistory: promotionHistory
      .map((item: any) => ({
        id: item.id,
        date: item.date || '',
        type: item.type,
        from: item.from_position || '',
        to: item.to_position,
      }))
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
    
    education: education
      .map((item: any) => ({ ...item }))
      .sort((a: any, b: any) => (b.year || '').localeCompare(a.year || '')),
    
    nonFormalEducation: nonFormalEducation
      .map((item: any) => ({ ...item }))
      .sort((a: any, b: any) => (b.year || '').localeCompare(a.year || '')),
    
    languages: languages.map((item: any) => ({ ...item })),
    
    skills: skills.map((item: any) => ({ ...item })),
    
    training: training
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        provider: item.provider,
        date: item.date || '',
      }))
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
    
    careerInterests: careerInterests.map((item: any) => ({ ...item })),
    
    orgExperience: orgExperience.map((item: any) => ({ ...item })),
    
    socialActivities: socialActivities
      .map((item: any) => ({
        id: item.id,
        activity: item.activity,
        organization: item.organization,
        role: item.role,
        startDate: item.start_date || '',
        endDate: item.end_date || '',
      }))
      .sort((a: any, b: any) => (b.startDate || '').localeCompare(a.startDate || '')),
    
    committeeExperience: committeeExperience
      .map((item: any) => ({ ...item }))
      .sort((a: any, b: any) => (b.year || '').localeCompare(a.year || '')),
    
    achievements: achievements
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        level: item.level,
        date: item.date || '',
        description: item.description || '',
      }))
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
  };

  return <ProfileClient initialData={mappedProfile} />
}
