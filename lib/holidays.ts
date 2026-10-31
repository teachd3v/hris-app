import { and, gte, lte } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>

/** Tanggal hari libur dalam rentang [from, to] (inklusif), untuk perhitungan cuti di server. */
export async function loadHolidayDates(db: Db, from: string, to: string): Promise<Set<string>> {
  const rows = await db
    .select({ date: schema.holidays.date })
    .from(schema.holidays)
    .where(and(gte(schema.holidays.date, from), lte(schema.holidays.date, to)))
  return new Set(rows.map((r) => r.date))
}
