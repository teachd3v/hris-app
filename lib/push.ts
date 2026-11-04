// Pengiriman Web Push ke perangkat karyawan. Dipanggil SETELAH aksi berhasil; kegagalan push tidak boleh menggagalkan aksi.
// Konfigurasi (secret Worker): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (opsional). Tanpa itu, push dilewati diam-diam.
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import { sendWebPush, type VapidConfig } from '@/lib/web-push'
import type { NotifyInput } from '@/lib/notifications'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>

const MAX_DEVICES_PER_CALL = 40 // batas subrequest per permintaan Worker

export function vapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT?.trim() || 'https://hrteach.site' }
}

// Endpoint hanya boleh milik layanan push resmi browser (mencegah server dipakai menembak alamat sembarang).
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com']
export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint)
    return u.protocol === 'https:' && !u.username && !u.password && PUSH_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export interface PushMessage {
  title: string
  body?: string | null
  href?: string | null
  /** Notifikasi dengan tag sama saling menggantikan (tidak menumpuk) */
  tag?: string
}

/** Kirim satu pesan ke semua perangkat milik para penerima. Mengembalikan jumlah terkirim; langganan mati dihapus. */
export async function sendPushToEmployees(db: Db, employeeIds: string[], message: PushMessage, vapid: VapidConfig): Promise<number> {
  if (employeeIds.length === 0) return 0
  const subs = await db.select().from(schema.push_subscriptions).where(inArray(schema.push_subscriptions.employee_id, employeeIds)).limit(MAX_DEVICES_PER_CALL)
  const payload = JSON.stringify({ title: message.title, body: message.body ?? '', href: message.href ?? '/employee/notifikasi', tag: message.tag })
  let sent = 0
  await Promise.allSettled(subs.map(async (s) => {
    try {
      const res = await sendWebPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload, vapid)
      if (res.gone) await db.delete(schema.push_subscriptions).where(eq(schema.push_subscriptions.endpoint, s.endpoint))
      else if (res.status >= 200 && res.status < 300) sent++
      else console.warn('Push ditolak', res.status, new URL(s.endpoint).hostname)
    } catch (e) {
      console.warn('Push gagal', new URL(s.endpoint).hostname, e instanceof Error ? e.message : e)
    }
  }))
  return sent
}

/** Kirim push untuk daftar notifikasi, tanpa menunggu (waitUntil di Workers). Aman dipanggil tanpa konfigurasi VAPID. */
export function pushInBackground(db: Db, items: NotifyInput[]): void {
  const vapid = vapidConfig()
  if (!vapid || items.length === 0) return
  const job = (async () => {
    for (const i of items) {
      await sendPushToEmployees(db, [i.employeeId], { title: i.title, body: i.body, href: i.href, tag: `${i.type}:${i.entityId ?? ''}` }, vapid)
    }
  })().catch((e) => console.warn('Push latar belakang gagal', e))
  try {
    getCloudflareContext().ctx.waitUntil(job)
  } catch {
    // Di luar konteks Worker (mis. pengembangan lokal): biarkan berjalan sendiri
  }
}
