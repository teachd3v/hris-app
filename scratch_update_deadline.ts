import { createClient } from './lib/supabase/server'

async function updateDeadline() {
  const supabase = await createClient()
  const { error } = await supabase
    .from('employee_assessments')
    .update({ deadline: '2026-05-20' })
    .neq('status', 'Selesai') // Only update those not finished, or all
    
  if (error) {
    console.error('Error updating deadline:', error)
  } else {
    console.log('Deadline updated successfully to 20 Mei 2026')
  }
}

updateDeadline()
