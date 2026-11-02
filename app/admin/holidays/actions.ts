'use server'

import { getAdminContext } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { parseIsoDate, HOLIDAY_TYPES } from '@/lib/leave'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auditStmt } from '@/lib/audit'

async function requireAdminActionCtx() {
  const admin = await getAdminContext()
  if (!admin) throw new Error('Unauthorized')
  return { db: getDb(), actor: { id: admin.emp.id, name: admin.emp.name, email: admin.emp.email } }
}
async function requireAdminAction() {
  return (await requireAdminActionCtx()).db
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
  const { db, actor } = await requireAdminActionCtx()

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
  const list = [...byDate.values()]
  await db.batch([
    ...list.map((h) =>
      db.insert(schema.holidays)
        .values({ date: h.date, name: h.name, type: h.type, created_at: now })
        .onConflictDoUpdate({ target: schema.holidays.date, set: { name: h.name, type: h.type } }),
    ),
    ...(await auditStmt(db, actor, {
      action: 'holiday.save', targetType: 'holiday', targetLabel: list.length === 1 ? `${list[0].date} ${list[0].name}` : `${list.length} tanggal`,
      details: { count: list.length, items: list.slice(0, 20).map((h) => `${h.date} ${h.name} (${h.type})`) },
    })),
  ] as any)

  revalidatePath('/admin/holidays')
  return { saved: byDate.size }
}

export async function deleteHoliday(date: string): Promise<{ error?: string }> {
  const { db, actor } = await requireAdminActionCtx()
  if (!parseIsoDate(date)) return { error: 'Tanggal tidak valid' }
  const [existing] = await db.select().from(schema.holidays).where(eq(schema.holidays.date, date)).limit(1)
  if (!existing) return {}
  await db.batch([
    db.delete(schema.holidays).where(eq(schema.holidays.date, date)),
    ...(await auditStmt(db, actor, { action: 'holiday.delete', targetType: 'holiday', targetId: date, targetLabel: `${date} ${existing.name}`, details: { name: existing.name, type: existing.type } })),
  ] as any)
  revalidatePath('/admin/holidays')
  return {}
}
