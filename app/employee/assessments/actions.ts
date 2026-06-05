'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch all templates
  const { data: templates, error: templatesError } = await supabase
    .from('assessment_templates')
    .select('*')
  if (templatesError) throw new Error(templatesError.message)

  // Fetch employee assessments
  const { data: assessments, error: assessError } = await supabase
    .from('employee_assessments')
    .select('*')
    .eq('employee_id', user.id)
  if (assessError) throw new Error(assessError.message)

  // Combine data for the UI
  const combinedData = assessments?.map(a => {
    const t = templates?.find(t => t.id === a.template_id)
    return {
      id: a.id,
      employee_id: a.employee_id ?? '',
      template_id: a.template_id ?? '',
      status: a.status as "Belum Diisi" | "Selesai" | "Terlewat",
      deadline: a.deadline,
      answers: a.answers,
      score: a.score,
      feedback: a.feedback,
      submitted_at: a.submitted_at,
      title: t?.title || 'Unknown Assessment',
      category: t?.category || 'General',
      description: t?.description ?? ''
    }
  }) || []

  // If there's a template that wasn't mapped (e.g. before backfill is executed), we can list it as virtual "Belum Diisi"
  for (const t of templates || []) {
    const exists = combinedData.some(c => c.template_id === t.id)
    if (!exists) {
      const deadlineDate = new Date()
      deadlineDate.setDate(21)
      combinedData.push({
        id: `virtual-${t.id}`,
        employee_id: user.id,
        template_id: t.id,
        status: 'Belum Diisi',
        deadline: deadlineDate.toISOString().split('T')[0],
        answers: null,
        score: null,
        feedback: null,
        submitted_at: null,
        title: t.title,
        category: t.category,
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: assessment, error } = await supabase
    .from('employee_assessments')
    .select(`
      *,
      assessment_templates (*)
    `)
    .eq('id', id)
    .eq('employee_id', user.id)
    .single()

  if (error) throw new Error(error.message)
  return assessment
}

export async function submitAssessment(id: string, answers: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('employee_assessments')
    .update({
      answers,
      status: 'Selesai',
      submitted_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('employee_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/employee/assessments')
  revalidatePath(`/employee/assessments/${id}`)
}
