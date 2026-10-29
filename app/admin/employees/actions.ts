"use server"

import { requireAdmin } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeApprovalStatus(
  employeeId: string,
  approvalStatus: 'Approved' | 'Rejected' | 'Pending',
  role?: 'Karyawan' | 'Admin'
) {
  await requireAdmin()
  const db = getDb()

  const updates: Record<string, any> = {
    approval_status: approvalStatus,
    updated_at: new Date().toISOString(),
  }
  if (role) updates.role = role

  await db
    .update(schema.employees)
    .set(updates)
    .where(eq(schema.employees.id, employeeId))

  revalidatePath('/admin/employees')
}
