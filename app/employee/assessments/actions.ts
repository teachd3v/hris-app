'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export interface AssessmentTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  opening_text: string;
  schema: any;
}

export interface EmployeeAssessment {
  id: string;
  employee_id: string;
  template_id: string;
  status: "Belum Diisi" | "Selesai" | "Terlewat";
  deadline: string | null;
  answers: any | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  
  // Joined fields from template
  title?: string;
  category?: string;
  description?: string;
}

export async function getEmployeeAssessments(): Promise<EmployeeAssessment[]> {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) return []
  const employee = empRecords[0]

  // Fetch all templates
  const templates = await db.select().from(schema.assessment_templates)

  // Fetch employee assessments
  const assessments = await db.select().from(schema.employee_assessments).where(eq(schema.employee_assessments.employee_id, employee.id))

  // Combine data for the UI
  const combinedData = assessments.map((a: any) => {
    const t = templates.find(t => t.id === a.template_id)
    return {
      id: a.id,
      employee_id: a.employee_id ?? '',
      template_id: a.template_id ?? '',
      status: a.status as "Belum Diisi" | "Selesai" | "Terlewat",
      deadline: a.deadline,
      answers: typeof a.answers === 'string' ? JSON.parse(a.answers) : a.answers,
      score: a.score !== null ? Number(a.score) : null,
      feedback: a.feedback,
      submitted_at: a.submitted_at,
      title: t?.title || 'Unknown Assessment',
      category: t?.category || 'General',
      description: t?.description ?? ''
    }
  })

  // If there's a template that wasn't mapped (e.g. before backfill is executed), we can list it as virtual "Belum Diisi"
  for (const t of templates || []) {
    const exists = combinedData.some((c: any) => c.template_id === t.id)
    if (!exists) {
      const deadlineDate = new Date()
      deadlineDate.setDate(21)
      combinedData.push({
        id: `virtual-${t.id}`,
        employee_id: employee.id,
        template_id: t.id,
        status: 'Belum Diisi',
        deadline: deadlineDate.toISOString().split('T')[0],
        answers: null,
        score: null,
        feedback: null,
        submitted_at: null,
        title: t.title ?? '',
        category: t.category ?? '',
        description: t.description ?? ''
      })
    }
  }

  // Sort by status: Belum Diisi first, then deadline
  return combinedData.sort((a, b) => {
    if (a.status === 'Belum Diisi' && b.status !== 'Belum Diisi') return -1;
    if (a.status !== 'Belum Diisi' && b.status === 'Belum Diisi') return 1;
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return 0;
  });
}

export async function getAssessmentDetails(id: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  const assessmentRecords = await db.select().from(schema.employee_assessments).where(and(eq(schema.employee_assessments.id, id), eq(schema.employee_assessments.employee_id, employee.id))).limit(1)
  if (assessmentRecords.length === 0) throw new Error('Assessment not found')
  const assessment = assessmentRecords[0]

  const templateRecords = await db.select().from(schema.assessment_templates).where(eq(schema.assessment_templates.id, assessment.template_id ?? '')).limit(1)

  return {
    ...assessment,
    answers: typeof assessment.answers === 'string' ? JSON.parse(assessment.answers) : assessment.answers,
    assessment_templates: templateRecords.length > 0 ? {
      ...templateRecords[0],
      schema: typeof templateRecords[0].schema === 'string' ? JSON.parse(templateRecords[0].schema) : templateRecords[0].schema
    } : null
  }
}

export async function submitAssessment(id: string, answers: any) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  await db.update(schema.employee_assessments).set({
    answers: JSON.stringify(answers), // Ensure object is stringified for SQLite D1
    status: 'Selesai',
    submitted_at: new Date().toISOString()
  }).where(and(eq(schema.employee_assessments.id, id), eq(schema.employee_assessments.employee_id, employee.id)))

  revalidatePath('/employee/assessments')
  revalidatePath(`/employee/assessments/${id}`)
}

export async function getEmployeeBasicProfile() {
  const session = await auth()
  if (!session?.user?.email) return null

  const db = getDb()
  const empRecords = await db.select({ name: schema.employees.name, photo_url: schema.employees.photo_url }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  
  if (empRecords.length === 0) return null
  return empRecords[0]
}
