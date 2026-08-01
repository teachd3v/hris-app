'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import { getStorageClient, BUCKET_NAME } from '@/lib/storage'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeProfile(section: string, updates: any) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')
  
  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employeeId = empRecords[0].id

  try {
    if (section === 'personal') {
      await db.update(schema.employees).set({
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
      }).where(eq(schema.employees.id, employeeId))
    } else if (section === 'bank') {
      await db.update(schema.employees).set({
        bank: updates.bank
      }).where(eq(schema.employees.id, employeeId))
    } else if (section === 'employment') {
      const finalCode = updates.employeeCode?.trim() || null;
      await db.update(schema.employees).set({
        employee_code: finalCode,
        title: updates.title,
        dept: updates.dept,
        level: updates.level,
        status: updates.status,
        join_date: updates.join || null,
        tenure: updates.tenure,
        manager: updates.manager,
      }).where(eq(schema.employees.id, employeeId))
    } else if (section === 'family') {
      await db.delete(schema.family_members).where(eq(schema.family_members.employee_id, employeeId))
      if (updates.family?.length > 0) {
        await db.insert(schema.family_members).values(updates.family.map((f: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          relationship: f.relationship,
          name: f.name,
          birth_date: f.birthDate || null,
          occupation: f.occupation,
          phone: f.phone
        })))
      }
    } else if (section === 'emergency-contacts') {
      await db.delete(schema.emergency_contacts).where(eq(schema.emergency_contacts.employee_id, employeeId))
      if (updates.emergencyContacts?.length > 0) {
        await db.insert(schema.emergency_contacts).values(updates.emergencyContacts.map((c: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          address: c.address
        })))
      }
    } else if (section === 'work-experience') {
      await db.delete(schema.work_experiences).where(eq(schema.work_experiences.employee_id, employeeId))
      if (updates.workExperience?.length > 0) {
        await db.insert(schema.work_experiences).values(updates.workExperience.map((w: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          company: w.company,
          position: w.position,
          start_date: w.startDate || null,
          end_date: w.endDate || null,
          description: w.description
        })))
      }
    } else if (section === 'promotion-history') {
      await db.delete(schema.promotion_histories).where(eq(schema.promotion_histories.employee_id, employeeId))
      if (updates.promotionHistory?.length > 0) {
        await db.insert(schema.promotion_histories).values(updates.promotionHistory.map((p: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          date: p.date,
          type: p.type,
          from_position: p.from,
          to_position: p.to
        })))
      }
    } else if (section === 'education') {
      await db.delete(schema.educations).where(eq(schema.educations.employee_id, employeeId))
      if (updates.education?.length > 0) {
        await db.insert(schema.educations).values(updates.education.map((e: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          institution: e.institution,
          level: e.level,
          field: e.field,
          year: e.year
        })))
      }
    } else if (section === 'non-formal-education') {
      await db.delete(schema.non_formal_educations).where(eq(schema.non_formal_educations.employee_id, employeeId))
      if (updates.nonFormalEducation?.length > 0) {
        await db.insert(schema.non_formal_educations).values(updates.nonFormalEducation.map((e: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          name: e.name,
          institution: e.institution,
          year: e.year
        })))
      }
    } else if (section === 'training') {
      await db.delete(schema.trainings).where(eq(schema.trainings.employee_id, employeeId))
      if (updates.training?.length > 0) {
        await db.insert(schema.trainings).values(updates.training.map((t: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          name: t.name,
          provider: t.provider,
          date: t.date || null
        })))
      }
    } else if (section === 'languages') {
      await db.delete(schema.languages).where(eq(schema.languages.employee_id, employeeId))
      if (updates.languages?.length > 0) {
        await db.insert(schema.languages).values(updates.languages.map((l: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          name: l.name,
          proficiency: l.proficiency
        })))
      }
    } else if (section === 'skills') {
      await db.delete(schema.skills).where(eq(schema.skills.employee_id, employeeId))
      if (updates.skills?.length > 0) {
        await db.insert(schema.skills).values(updates.skills.map((s: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          name: s.name,
          proficiency: s.proficiency
        })))
      }
    } else if (section === 'org-experience') {
      await db.delete(schema.org_experiences).where(eq(schema.org_experiences.employee_id, employeeId))
      if (updates.orgExperience?.length > 0) {
        await db.insert(schema.org_experiences).values(updates.orgExperience.map((o: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          organization: o.organization,
          role: o.role,
          period: o.period
        })))
      }
    } else if (section === 'social-activities') {
      await db.delete(schema.social_activities).where(eq(schema.social_activities.employee_id, employeeId))
      if (updates.socialActivities?.length > 0) {
        await db.insert(schema.social_activities).values(updates.socialActivities.map((a: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          activity: a.activity,
          organization: a.organization,
          role: a.role,
          start_date: a.startDate || null,
          end_date: a.endDate || null
        })))
      }
    } else if (section === 'committee-experience') {
      await db.delete(schema.committee_experiences).where(eq(schema.committee_experiences.employee_id, employeeId))
      if (updates.committeeExperience?.length > 0) {
        await db.insert(schema.committee_experiences).values(updates.committeeExperience.map((c: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          event: c.event,
          role: c.role,
          year: c.year
        })))
      }
    } else if (section === 'achievements') {
      await db.delete(schema.achievements).where(eq(schema.achievements.employee_id, employeeId))
      if (updates.achievements?.length > 0) {
        await db.insert(schema.achievements).values(updates.achievements.map((a: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          title: a.title,
          level: a.level,
          date: a.date || null,
          description: a.description
        })))
      }
    } else if (section === 'career-interests') {
      await db.delete(schema.career_interests).where(eq(schema.career_interests.employee_id, employeeId))
      if (updates.careerInterests?.length > 0) {
        await db.insert(schema.career_interests).values(updates.careerInterests.map((c: any) => ({
          id: crypto.randomUUID(),
          employee_id: employeeId,
          position: c.position,
          department: c.department
        })))
      }
    }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    if (error.message?.includes('UNIQUE constraint failed: employees.employee_code')) {
      throw new Error('Gagal menyimpan: Nomor Induk Karyawan ini sudah digunakan oleh akun karyawan lain.')
    }
    throw new Error(`Failed to update profile: ${error.message || JSON.stringify(error)}`)
  }

  revalidatePath('/employee/dashboard')
}

export async function uploadAvatar(base64Image: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')
  
  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employeeId = empRecords[0].id

  // Convert base64 to Blob
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  
  const fileName = `avatars/${employeeId}/avatar-${Date.now()}.jpg`
  const s3 = getStorageClient()

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg'
    }))
  } catch (error) {
    console.error('Error uploading avatar:', error)
    throw new Error('Failed to upload avatar')
  }

  const r2PublicUrl = process.env.R2_PUBLIC_URL || `https://pub-placeholder.r2.dev`
  const publicUrl = `${r2PublicUrl}/${fileName}`

  await db.update(schema.employees).set({ photo_url: publicUrl }).where(eq(schema.employees.id, employeeId))

  revalidatePath('/employee/dashboard')
  return publicUrl
}
