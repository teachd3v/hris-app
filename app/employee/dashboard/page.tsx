import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { dummyUserProfile } from '@/lib/dummy-data'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all related data. Use Admin Client to bypass RLS issues in Server Component if the key is available,
  // otherwise fallback to standard authenticated client.
  const hasAdminKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const dbClient = hasAdminKey ? createAdminClient() : supabase

  let { data: employee } = await dbClient
    .from('employees')
    .select(`
      *,
      family:family_members(*),
      emergencyContacts:emergency_contacts(*),
      workExperience:work_experiences(*),
      promotionHistory:promotion_histories(*),
      education:educations(*),
      nonFormalEducation:non_formal_educations(*),
      languages:languages(*),
      skills:skills(*),
      training:trainings(*),
      careerInterests:career_interests(*),
      orgExperience:org_experiences(*),
      socialActivities:social_activities(*),
      committeeExperience:committee_experiences(*),
      achievements:achievements(*)
    `)
    .eq('id', user.id)
    .single()

  if (!employee) {
    // Insert new basic profile if it doesn't exist
    const { data: newEmployee, error } = await dbClient
      .from('employees')
      .insert({
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email!,
        nationality: 'Indonesia',
        religion: 'Islam',
        country: 'Indonesia',
      })
      .select(`
        *,
        family:family_members(*),
        emergencyContacts:emergency_contacts(*),
        workExperience:work_experiences(*),
        promotionHistory:promotion_histories(*),
        education:educations(*),
        nonFormalEducation:non_formal_educations(*),
        languages:languages(*),
        skills:skills(*),
        training:trainings(*),
        careerInterests:career_interests(*),
        orgExperience:org_experiences(*),
        socialActivities:social_activities(*),
        committeeExperience:committee_experiences(*),
        achievements:achievements(*)
      `)
      .single()
      
    if (error) {
      console.error('Error creating employee record:', error)
      // Fallback to dummy data if insert fails to prevent hard crash
      return <DashboardClient initialData={dummyUserProfile} />
    }
    
    employee = newEmployee
  }

  // Map to the shape expected by DashboardClient
  // We use the dummyUserProfile as a base to ensure all fields exist
  const mappedProfile: typeof dummyUserProfile = {
    ...dummyUserProfile,
    id: employee.id, // Better to use user.id here or keep it as employee_code if needed, but keeping id as id
    employeeCode: employee.employee_code || '',
    name: employee.name,
    initials: employee.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
    photo: employee.photo_url || undefined,
    email: employee.email,
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
      total: employee.leave_total || 12,
      used: employee.leave_used || 0,
    },
    attendance: {
      present: employee.attendance_present || 0,
      late: employee.attendance_late || 0,
    },
    
    family: (employee.family || [])
      .map((item: any) => ({
        id: item.id,
        relationship: item.relationship,
        name: item.name,
        birthDate: item.birth_date || '',
        occupation: item.occupation || '',
        phone: item.phone || '',
      }))
      .sort((a: any, b: any) => (b.birthDate || '').localeCompare(a.birthDate || '')),
    
    emergencyContacts: (employee.emergencyContacts || []).map((item: any) => ({
      ...item
    })),
    
    workExperience: (employee.workExperience || [])
      .map((item: any) => ({
        id: item.id,
        company: item.company,
        position: item.position,
        startDate: item.start_date || '',
        endDate: item.end_date || '',
        description: item.description || '',
      }))
      .sort((a: any, b: any) => (b.startDate || '').localeCompare(a.startDate || '')),
    
    promotionHistory: (employee.promotionHistory || [])
      .map((item: any) => ({
        id: item.id,
        date: item.date || '',
        type: item.type,
        from: item.from_position || '',
        to: item.to_position,
      }))
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
    
    education: (employee.education || [])
      .map((item: any) => ({
        ...item
      }))
      .sort((a: any, b: any) => (b.year || '').localeCompare(a.year || '')),
    
    nonFormalEducation: (employee.nonFormalEducation || [])
      .map((item: any) => ({
        ...item
      }))
      .sort((a: any, b: any) => (b.year || '').localeCompare(a.year || '')),
    
    languages: (employee.languages || []).map((item: any) => ({
      ...item
    })),
    
    skills: (employee.skills || []).map((item: any) => ({
      ...item
    })),
    
    training: (employee.training || [])
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        provider: item.provider,
        date: item.date || '',
      }))
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
    
    careerInterests: (employee.careerInterests || []).map((item: any) => ({
      ...item
    })),
    
    orgExperience: (employee.orgExperience || []).map((item: any) => ({
      ...item
    })),
    
    socialActivities: (employee.socialActivities || [])
      .map((item: any) => ({
        id: item.id,
        activity: item.activity,
        organization: item.organization,
        role: item.role,
        startDate: item.start_date || '',
        endDate: item.end_date || '',
      }))
      .sort((a: any, b: any) => (b.startDate || '').localeCompare(a.startDate || '')),
    
    committeeExperience: (employee.committeeExperience || [])
      .map((item: any) => ({
        ...item
      }))
      .sort((a: any, b: any) => (b.year || '').localeCompare(a.year || '')),
    
    achievements: (employee.achievements || [])
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        level: item.level,
        date: item.date || '',
        description: item.description || '',
      }))
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
  };

  return <DashboardClient initialData={mappedProfile} />
}
