import { and, count, eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>

/** Jumlah pengajuan bawahan langsung yang menunggu persetujuan atasan ini (untuk badge di beranda). */
export async function countPendingForManager(db: Db, managerId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(schema.leave_requests)
    .innerJoin(schema.employees, eq(schema.leave_requests.employee_id, schema.employees.id))
    .where(and(eq(schema.employees.manager_id, managerId), eq(schema.leave_requests.status, 'PENDING_DIRECT_MANAGER')))
  return row?.n ?? 0
}
