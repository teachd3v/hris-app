'use server'

import { getAdminContext } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { parseIsoDate, HOLIDAY_TYPES } from '@/lib/leave'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function requireAdminAction() {
  const admin = await getAdminContext()
  if (!admin) throw new Error('Unauthorized')
  return getDb()
}

export interface HolidayRow {
  date: string
  name: string
  type: string
}

export async function listHolidays(year: number): Promise<HolidayRow[]> {
  const db = await requireAdminAction()
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return []
  return db
    .select({ date: schema.holidays.date, name: schema.holidays.name, type: schema.holidays.type })
    .from(schema.holidays)
    .where(and(gte(schema.holidays.date, `${year}-01-01`), lte(schema.holidays.date, `${year}-12-31`)))
    .orderBy(asc(schema.holidays.date))
}

/** Tambah/ubah hari libur (satu baris per tanggal; tanggal yang sudah ada diperbarui). */
export async function saveHolidays(entries: HolidayRow[]): Promise<{ error?: string; saved?: number }> {
  const db = await requireAdminAction()

  if (!Array.isArray(entries) || entries.length === 0) return { error: 'Tidak ada data untuk disimpan' }
  if (entries.length > 400) return { error: 'Maksimal 400 tanggal sekaligus' }

  const validTypes = HOLIDAY_TYPES.map((t) => t.key as string)
  const byDate = new Map<string, HolidayRow>()
  for (const e of entries) {
    const name = String(e?.name ?? '').trim()
    if (!parseIsoDate(String(e?.date))) return { error: `Tanggal tidak valid: ${e?.date}` }
    if (!name || name.length > 100) return { error: `Nama libur wajib diisi (maks. 100 karakter) untuk ${e.date}` }
    if (!validTypes.includes(e.type)) return { error: `Jenis tidak valid untuk ${e.date}` }
    byDate.set(e.date, { date: e.date, name, type: e.type })
  }

  const now = new Date().toISOString()
  await db.batch([...byDate.values()].map((h) =>
    db.insert(schema.holidays)
      .values({ date: h.date, name: h.name, type: h.type, created_at: now })
      .onConflictDoUpdate({ target: schema.holidays.date, set: { name: h.name, type: h.type } }),
  ) as any)

  revalidatePath('/admin/holidays')
  return { saved: byDate.size }
}

export async function deleteHoliday(date: string): Promise<{ error?: string }> {
  const db = await requireAdminAction()
  if (!parseIsoDate(date)) return { error: 'Tanggal tidak valid' }
  await db.delete(schema.holidays).where(eq(schema.holidays.date, date))
  revalidatePath('/admin/holidays')
  return {}
}
