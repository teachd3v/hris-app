'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getAssessmentAnalysis(templateId: string) {
  await requireAdmin()
  const db = getDb()

  const [tRes, aRes, empRes] = await Promise.all([
    db.select().from(schema.assessment_templates).where(eq(schema.assessment_templates.id, templateId)).limit(1),
    db.select().from(schema.employee_assessments).where(eq(schema.employee_assessments.template_id, templateId)),
    db.select({
      id: schema.employees.id,
      name: schema.employees.name,
      email: schema.employees.email,
      dept: schema.employees.dept,
      title: schema.employees.title,
      photo_url: schema.employees.photo_url,
      employee_code: schema.employees.employee_code
    }).from(schema.employees).orderBy(schema.employees.name),
  ])

  const template = tRes.length > 0 ? {
    ...tRes[0],
    schema: typeof tRes[0].schema === 'string' ? JSON.parse(tRes[0].schema) : tRes[0].schema
  } : null

  const employeesMap = new Map(empRes.map(e => [e.id, e]))

  const assessments = aRes.map(a => ({
    ...a,
    answers: typeof a.answers === 'string' ? JSON.parse(a.answers) : a.answers,
    employees: a.employee_id ? employeesMap.get(a.employee_id) : null
  }))

  return {
    template,
    assessments,
    employees: empRes,
  }
}

export async function getAssessmentResult(templateId: string, resultId: string) {
  await requireAdmin()
  const db = getDb()

  const [tRes, aRes] = await Promise.all([
    db.select().from(schema.assessment_templates).where(eq(schema.assessment_templates.id, templateId)).limit(1),
    db.select().from(schema.employee_assessments).where(eq(schema.employee_assessments.id, resultId)).limit(1),
  ])

  const assessmentRaw = aRes.length > 0 ? aRes[0] : null
  
  let employee = null
  let profileData = null

  if (assessmentRaw && assessmentRaw.employee_id) {
    const empRes = await db.select().from(schema.employees).where(eq(schema.employees.id, assessmentRaw.employee_id)).limit(1)
    if (empRes.length > 0) employee = empRes[0]

    const empId = assessmentRaw.employee_id
    const [promo, training, skill, achievement] = await Promise.all([
      db.select().from(schema.promotion_histories).where(eq(schema.promotion_histories.employee_id, empId)).orderBy(desc(schema.promotion_histories.date)),
      db.select().from(schema.trainings).where(eq(schema.trainings.employee_id, empId)).orderBy(desc(schema.trainings.date)),
      db.select().from(schema.skills).where(eq(schema.skills.employee_id, empId)),
      db.select().from(schema.achievements).where(eq(schema.achievements.employee_id, empId)).orderBy(desc(schema.achievements.date)),
    ])
    
    profileData = {
      promotions: promo,
      trainings: training,
      skills: skill,
      achievements: achievement,
    }
  }

  const assessment = assessmentRaw ? {
    ...assessmentRaw,
    answers: typeof assessmentRaw.answers === 'string' ? JSON.parse(assessmentRaw.answers) : assessmentRaw.answers,
    employees: employee
  } : null

  const template = tRes.length > 0 ? {
    ...tRes[0],
    schema: typeof tRes[0].schema === 'string' ? JSON.parse(tRes[0].schema) : tRes[0].schema
  } : null

  return {
    template,
    assessment,
    profileData,
  }
}
