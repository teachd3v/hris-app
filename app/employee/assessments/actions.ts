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
  if (!session?.user?.email) return []

  try {
    const db = getDb()
    const userEmail = session.user.email.toLowerCase().trim()
    const empRecords = await db.select({ id: schema.employees.id, email: schema.employees.email }).from(schema.employees)
    const matchingEmployees = empRecords.filter(e => (e.email || '').toLowerCase().trim() === userEmail)
    
    if (matchingEmployees.length === 0) return []
    const empIds = matchingEmployees.map(e => e.id)

    // Fetch all templates
    const templates = await db.select().from(schema.assessment_templates)

    // Fetch employee assessments for any matching employee ID
    const allAssessments = await db.select().from(schema.employee_assessments)
    const assessments = allAssessments.filter(a => empIds.includes(a.employee_id || ''))

    // Combine data for the UI
    const combinedData = assessments.map((a: any) => {
      const t = templates.find(t => t.id === a.template_id)
      let parsedAnswers = a.answers
      if (typeof a.answers === 'string') {
        try {
          parsedAnswers = JSON.parse(a.answers)
        } catch (e) {
          try {
            parsedAnswers = JSON.parse(a.answers.replace(/\\\\"/g, '\\"'))
          } catch (e2) {
            parsedAnswers = null
          }
        }
      }
      return {
        id: a.id,
        employee_id: a.employee_id ?? '',
        template_id: a.template_id ?? '',
        status: a.status as "Belum Diisi" | "Selesai" | "Terlewat",
        deadline: a.deadline,
        answers: parsedAnswers,
        score: a.score !== null ? Number(a.score) : null,
        feedback: a.feedback,
        submitted_at: a.submitted_at,
        title: t?.title || 'Self-Assessment Motivasi Kerja (SDT)',
        category: t?.category || 'SELF-ASSESSMENT',
        description: t?.description ?? 'Evaluasi mandiri mengenai motivasi bekerja berdasarkan Self Determination Theory (SDT).'
      }
    })

    // If there's a template that wasn't mapped for this employee, list it as virtual "Belum Diisi"
    for (const t of templates || []) {
      const exists = combinedData.some((c: any) => c.template_id === t.id)
      if (!exists) {
        const deadlineDate = new Date()
        deadlineDate.setDate(21)
        combinedData.push({
          id: `virtual-${t.id}`,
          employee_id: empIds[0],
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
  } catch (err) {
    console.error("Error fetching employee assessments:", err);
    return [];
  }
}

export async function getAssessmentDetails(id: string) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const db = getDb()
  const empRecords = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.email, session.user.email)).limit(1)
  if (empRecords.length === 0) throw new Error('Employee not found')
  const employee = empRecords[0]

  let assessment: any = null
  let templateId = ''

  if (id.startsWith('virtual-')) {
    templateId = id.replace('virtual-', '')
  } else {
    const assessmentRecords = await db.select().from(schema.employee_assessments).where(and(eq(schema.employee_assessments.id, id), eq(schema.employee_assessments.employee_id, employee.id))).limit(1)
    if (assessmentRecords.length > 0) {
      assessment = assessmentRecords[0]
      templateId = assessment.template_id ?? ''
    }
  }

  const templateRecords = await db.select().from(schema.assessment_templates).where(eq(schema.assessment_templates.id, templateId)).limit(1)
  if (templateRecords.length === 0) throw new Error('Template not found')
  const template = templateRecords[0]

  let parsedAnswers: any = assessment?.answers
  if (typeof parsedAnswers === 'string') {
    try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) { parsedAnswers = null; }
  }

  let parsedSchema: any = template.schema
  if (typeof parsedSchema === 'string') {
    try { parsedSchema = JSON.parse(parsedSchema); } catch (e) { parsedSchema = []; }
  }

  return {
    id: assessment?.id ?? id,
    employee_id: employee.id,
    template_id: template.id,
    status: assessment?.status ?? 'Belum Diisi',
    deadline: assessment?.deadline ?? null,
    answers: parsedAnswers,
    score: assessment?.score ?? null,
    feedback: assessment?.feedback ?? null,
    submitted_at: assessment?.submitted_at ?? null,
    assessment_templates: {
      ...template,
      schema: parsedSchema
    }
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
