'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-guard'

export async function getAssessmentAnalysis(templateId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const [tRes, aRes, empRes] = await Promise.all([
    admin.from('assessment_templates').select('*').eq('id', templateId).single(),
    admin.from('employee_assessments')
      .select('*, employees(id, name, email, dept, title, photo_url, employee_code)')
      .eq('template_id', templateId),
    admin.from('employees')
      .select('id, name, email, dept, title, photo_url, employee_code')
      .order('name'),
  ])

  return {
    template: tRes.data,
    assessments: aRes.data || [],
    employees: empRes.data || [],
  }
}

export async function getAssessmentResult(templateId: string, resultId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const [tRes, aRes] = await Promise.all([
    admin.from('assessment_templates').select('*').eq('id', templateId).single(),
    admin.from('employee_assessments').select('*, employees(*)').eq('id', resultId).single(),
  ])

  const empId = aRes.data?.employee_id
  const profileData = empId
    ? await Promise.all([
        admin.from('promotion_histories').select('*').eq('employee_id', empId).order('date', { ascending: false }),
        admin.from('trainings').select('*').eq('employee_id', empId).order('date', { ascending: false }),
        admin.from('skills').select('*').eq('employee_id', empId),
        admin.from('achievements').select('*').eq('employee_id', empId).order('date', { ascending: false }),
      ]).then(([promo, training, skill, achievement]) => ({
        promotions: promo.data || [],
        trainings: training.data || [],
        skills: skill.data || [],
        achievements: achievement.data || [],
      }))
    : null

  return {
    template: tRes.data,
    assessment: aRes.data,
    profileData,
  }
}
