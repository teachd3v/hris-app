'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeProfile(section: string, updates: any) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let error = null

  if (section === 'personal') {
    const { error: err } = await supabase.from('employees').update({
       email: updates.email,
       phone: updates.phone,
       nik: updates.nik,
       birth_date: updates.birth || null,
       gender: updates.gender,
       blood_type: updates.bloodType,
       nationality: updates.nationality,
       marital_status: updates.maritalStatus,
       religion: updates.religion,
       address: updates.address,
       ktp_address: updates.ktpAddress,
       city: updates.city,
       province: updates.province,
       postal_code: updates.postalCode,
       country: updates.country
    }).eq('id', user.id)
    error = err
  } else if (section === 'bank') {
    const { error: err } = await supabase.from('employees').update({
       bank: updates.bank
    }).eq('id', user.id)
    error = err
  } else if (section === 'employment') {
    const finalCode = updates.employeeCode?.trim() || null;
    const { error: err } = await supabase.from('employees').update({
       employee_code: finalCode,
       title: updates.title,
       dept: updates.dept,
       level: updates.level,
       status: updates.status,
       join_date: updates.join || null,
       tenure: updates.tenure,
       manager: updates.manager,
    }).eq('id', user.id)
    error = err
  } else if (section === 'family') {
    await supabase.from('family_members').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('family_members').insert(
      updates.family.map((f: any) => ({
        employee_id: user.id,
        relationship: f.relationship,
        name: f.name,
        birth_date: f.birthDate || null,
        occupation: f.occupation,
        phone: f.phone
      }))
    )
    error = err
  } else if (section === 'emergency-contacts') {
    await supabase.from('emergency_contacts').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('emergency_contacts').insert(
      updates.emergencyContacts.map((c: any) => ({
        employee_id: user.id,
        name: c.name,
        relationship: c.relationship,
        phone: c.phone,
        address: c.address
      }))
    )
    error = err
  } else if (section === 'work-experience') {
    await supabase.from('work_experiences').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('work_experiences').insert(
      updates.workExperience.map((w: any) => ({
        employee_id: user.id,
        company: w.company,
        position: w.position,
        start_date: w.startDate || null,
        end_date: w.endDate || null,
        description: w.description
      }))
    )
    error = err
  } else if (section === 'promotion-history') {
    await supabase.from('promotion_histories').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('promotion_histories').insert(
      updates.promotionHistory.map((p: any) => ({
        employee_id: user.id,
        date: p.date,
        type: p.type,
        from_position: p.from,
        to_position: p.to
      }))
    )
    error = err
  } else if (section === 'education') {
    await supabase.from('educations').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('educations').insert(
      updates.education.map((e: any) => ({
        employee_id: user.id,
        institution: e.institution,
        level: e.level,
        field: e.field,
        year: e.year
      }))
    )
    error = err
  } else if (section === 'non-formal-education') {
    await supabase.from('non_formal_educations').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('non_formal_educations').insert(
      updates.nonFormalEducation.map((e: any) => ({
        employee_id: user.id,
        name: e.name,
        institution: e.institution,
        year: e.year
      }))
    )
    error = err
  } else if (section === 'training') {
    await supabase.from('trainings').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('trainings').insert(
      updates.training.map((t: any) => ({
        employee_id: user.id,
        name: t.name,
        provider: t.provider,
        date: t.date || null
      }))
    )
    error = err
  } else if (section === 'languages') {
    await supabase.from('languages').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('languages').insert(
      updates.languages.map((l: any) => ({
        employee_id: user.id,
        name: l.name,
        proficiency: l.proficiency
      }))
    )
    error = err
  } else if (section === 'skills') {
    await supabase.from('skills').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('skills').insert(
      updates.skills.map((s: any) => ({
        employee_id: user.id,
        name: s.name,
        proficiency: s.proficiency
      }))
    )
    error = err
  } else if (section === 'org-experience') {
    await supabase.from('org_experiences').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('org_experiences').insert(
      updates.orgExperience.map((o: any) => ({
        employee_id: user.id,
        organization: o.organization,
        role: o.role,
        period: o.period
      }))
    )
    error = err
  } else if (section === 'social-activities') {
    await supabase.from('social_activities').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('social_activities').insert(
      updates.socialActivities.map((a: any) => ({
        employee_id: user.id,
        activity: a.activity,
        organization: a.organization,
        role: a.role,
        start_date: a.startDate || null,
        end_date: a.endDate || null
      }))
    )
    error = err
  } else if (section === 'committee-experience') {
    await supabase.from('committee_experiences').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('committee_experiences').insert(
      updates.committeeExperience.map((c: any) => ({
        employee_id: user.id,
        event: c.event,
        role: c.role,
        year: c.year
      }))
    )
    error = err
  } else if (section === 'achievements') {
    await supabase.from('achievements').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('achievements').insert(
      updates.achievements.map((a: any) => ({
        employee_id: user.id,
        title: a.title,
        level: a.level,
        date: a.date || null,
        description: a.description
      }))
    )
    error = err
  } else if (section === 'career-interests') {
    await supabase.from('career_interests').delete().eq('employee_id', user.id)
    const { error: err } = await supabase.from('career_interests').insert(
      updates.careerInterests.map((c: any) => ({
        employee_id: user.id,
        position: c.position,
        department: c.department
      }))
    )
    error = err
  }
  
  if (error) {
    console.error('Error updating profile:', error)
    if (error.code === '23505' && error.message?.includes('employee_code')) {
      throw new Error('Gagal menyimpan: Nomor Induk Karyawan ini sudah digunakan oleh akun karyawan lain.')
    }
    throw new Error(`Failed to update profile: ${error.message || JSON.stringify(error)}`)
  }

  revalidatePath('/employee/dashboard')
}

export async function uploadAvatar(base64Image: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Convert base64 to Blob
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  
  const fileName = `${user.id}/avatar-${Date.now()}.jpg`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (error) {
    console.error('Error uploading avatar:', error)
    throw new Error('Failed to upload avatar')
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

  await supabase.from('employees').update({ photo_url: publicUrl }).eq('id', user.id)

  revalidatePath('/employee/dashboard')
  return publicUrl
}
