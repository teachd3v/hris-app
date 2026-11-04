'use server'

import { auth } from '@/auth'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { describePushFailure, isAllowedPushEndpoint, sendPushToEmployees, vapidConfig } from '@/lib/push'
import { and, asc, eq } from 'drizzle-orm'

const MAX_DEVICES_PER_EMPLOYEE = 8
const B64URL = /^[A-Za-z0-9_-]+$/

async function currentId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/** Apakah server sudah dikonfigurasi untuk push (kunci VAPID terpasang), dan kunci publiknya untuk langganan di perangkat. */
export async function getPushConfig(): Promise<{ enabled: boolean; publicKey: string | null }> {
  const vapid = vapidConfig()
  return { enabled: Boolean(vapid), publicKey: vapid?.publicKey ?? null }
}

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** Simpan (atau perbarui) langganan perangkat ini untuk karyawan yang login. */
export async function savePushSubscription(sub: PushSubscriptionInput, userAgent?: string): Promise<{ error?: string }> {
  const me = await currentId()
  if (!me) return { error: 'Belum login' }
  if (!vapidConfig()) return { error: 'Notifikasi HP belum diaktifkan di server' }
  const endpoint = String(sub?.endpoint ?? '')
  const p256dh = String(sub?.keys?.p256dh ?? '')
  const authKey = String(sub?.keys?.auth ?? '')
  if (!isAllowedPushEndpoint(endpoint) || endpoint.length > 600) return { error: 'Layanan notifikasi perangkat tidak dikenali' }
  if (!B64URL.test(p256dh) || !B64URL.test(authKey) || p256dh.length !== 87 || authKey.length !== 22) return { error: 'Kunci langganan tidak valid' }

  const db = getDb()
  const now = new Date().toISOString()
  // Perangkat yang sama bisa berpindah pemilik (mis. dipakai bergantian): endpoint unik, pemilik mengikuti akun yang login
  await db.insert(schema.push_subscriptions)
    .values({ id: crypto.randomUUID(), employee_id: me, endpoint, p256dh, auth: authKey, user_agent: (userAgent ?? '').slice(0, 200) || null, created_at: now })
    .onConflictDoUpdate({ target: schema.push_subscriptions.endpoint, set: { employee_id: me, p256dh, auth: authKey, user_agent: (userAgent ?? '').slice(0, 200) || null } })

  // Batasi jumlah perangkat per akun: yang terlama dihapus
  const mine = await db.select({ id: schema.push_subscriptions.id }).from(schema.push_subscriptions).where(eq(schema.push_subscriptions.employee_id, me)).orderBy(asc(schema.push_subscriptions.created_at))
  for (const old of mine.slice(0, Math.max(0, mine.length - MAX_DEVICES_PER_EMPLOYEE))) {
    await db.delete(schema.push_subscriptions).where(eq(schema.push_subscriptions.id, old.id))
  }
  return {}
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const me = await currentId()
  if (!me) return
  await getDb().delete(schema.push_subscriptions).where(and(eq(schema.push_subscriptions.endpoint, String(endpoint)), eq(schema.push_subscriptions.employee_id, me)))
}

/** Kirim notifikasi uji ke semua perangkat akun sendiri. Bila gagal, pesan menyebut penyebabnya (tanpa membocorkan token). */
export async function sendTestPush(): Promise<{ sent: number; error?: string }> {
  const me = await currentId()
  if (!me) return { sent: 0, error: 'Belum login' }
  const vapid = vapidConfig()
  if (!vapid) return { sent: 0, error: 'Notifikasi HP belum diaktifkan di server' }
  const r = await sendPushToEmployees(getDb(), [me], { title: 'Notifikasi uji', body: 'Notifikasi HP Anda sudah aktif.', href: '/employee/notifikasi', tag: 'test' }, vapid)
  if (r.sent > 0) return { sent: r.sent }
  if (r.devices === 0) return { sent: 0, error: 'Belum ada perangkat terdaftar untuk akun ini. Ketuk Matikan lalu Aktifkan lagi di perangkat ini.' }
  return { sent: 0, error: describePushFailure(r.failures, r.removed) }
}
