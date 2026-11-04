'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { and, count, desc, eq, isNotNull, isNull, lt } from 'drizzle-orm'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  href: string | null
  created_at: string
  read_at: string | null
}

const RETENTION_DAYS = 60
const LIMIT = 50

async function currentId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/** Jumlah belum dibaca (untuk badge lonceng). Mengembalikan 0 bila belum login. */
export async function getUnreadCount(): Promise<number> {
  const me = await currentId()
  if (!me) return 0
  const [row] = await getDb().select({ n: count() }).from(schema.notifications).where(and(eq(schema.notifications.employee_id, me), isNull(schema.notifications.read_at)))
  return row?.n ?? 0
}

/** 50 notifikasi terbaru milik sendiri. Sekalian membersihkan yang sudah dibaca dan lebih tua dari 60 hari. */
export async function getMyNotifications(): Promise<NotificationItem[]> {
  const me = await currentId()
  if (!me) return []
  const db = getDb()
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()
  await db.delete(schema.notifications).where(and(eq(schema.notifications.employee_id, me), isNotNull(schema.notifications.read_at), lt(schema.notifications.created_at, cutoff)))
  return db
    .select({ id: schema.notifications.id, type: schema.notifications.type, title: schema.notifications.title, body: schema.notifications.body, href: schema.notifications.href, created_at: schema.notifications.created_at, read_at: schema.notifications.read_at })
    .from(schema.notifications)
    .where(eq(schema.notifications.employee_id, me))
    .orderBy(desc(schema.notifications.created_at))
    .limit(LIMIT)
}

export async function markNotificationRead(id: string): Promise<void> {
  const me = await currentId()
  if (!me) return
  await getDb().update(schema.notifications).set({ read_at: new Date().toISOString() }).where(and(eq(schema.notifications.id, id), eq(schema.notifications.employee_id, me), isNull(schema.notifications.read_at)))
}

export async function markAllNotificationsRead(): Promise<void> {
  const me = await currentId()
  if (!me) return
  await getDb().update(schema.notifications).set({ read_at: new Date().toISOString() }).where(and(eq(schema.notifications.employee_id, me), isNull(schema.notifications.read_at)))
}
