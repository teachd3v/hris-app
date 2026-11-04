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

export interface PushFailure {
  /** Nama host layanan push (mis. fcm.googleapis.com), bukan URL lengkap (URL berisi token perangkat) */
  host: string
  /** Kode HTTP dari layanan push, bila ada jawaban */
  status?: number
  /** Pesan error lokal (enkripsi/jaringan), bila tidak ada jawaban */
  error?: string
}

export interface PushSummary {
  /** Jumlah perangkat terdaftar milik para penerima */
  devices: number
  sent: number
  /** Langganan yang sudah mati (404/410) dan dihapus */
  removed: number
  failures: PushFailure[]
}

/** Kirim satu pesan ke semua perangkat milik para penerima. Langganan mati dihapus; rincian kegagalan dikembalikan. */
export async function sendPushToEmployees(db: Db, employeeIds: string[], message: PushMessage, vapid: VapidConfig): Promise<PushSummary> {
  const summary: PushSummary = { devices: 0, sent: 0, removed: 0, failures: [] }
  if (employeeIds.length === 0) return summary
  const subs = await db.select().from(schema.push_subscriptions).where(inArray(schema.push_subscriptions.employee_id, employeeIds)).limit(MAX_DEVICES_PER_CALL)
  const payload = JSON.stringify({ title: message.title, body: message.body ?? '', href: message.href ?? '/employee/notifikasi', tag: message.tag })
  summary.devices = subs.length
  await Promise.allSettled(subs.map(async (s) => {
    const host = new URL(s.endpoint).hostname
    try {
      // Urgency tinggi: pemberitahuan persetujuan perlu sampai segera, termasuk saat HP dalam mode hemat daya (Doze)
      const res = await sendWebPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload, vapid, { urgency: 'high' })
      if (res.gone) {
        await db.delete(schema.push_subscriptions).where(eq(schema.push_subscriptions.endpoint, s.endpoint))
        summary.removed++
        summary.failures.push({ host, status: res.status })
      } else if (res.status >= 200 && res.status < 300) {
        summary.sent++
      } else {
        console.warn('Push ditolak', res.status, host)
        summary.failures.push({ host, status: res.status })
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      console.warn('Push gagal', host, error)
      summary.failures.push({ host, error })
    }
  }))
  return summary
}

/** Pesan untuk pengguna dari hasil pengiriman yang gagal (tanpa membocorkan token perangkat). */
export function describePushFailure(failures: PushFailure[], removed: number): string {
  const f = failures[0]
  const via = f?.host ? ` (${f.host})` : ''
  if (removed > 0) return 'Langganan perangkat ini sudah kedaluwarsa dan dihapus. Ketuk Aktifkan lagi di perangkat ini.'
  if (f?.status === 401 || f?.status === 403) return `Layanan push menolak kunci server${via}, kode ${f.status}. Periksa VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY: keduanya harus berasal dari satu kali pembuatan, tanpa spasi atau awalan "VAPID_...=". Setelah diperbaiki, Matikan lalu Aktifkan lagi notifikasi di perangkat.`
  if (f?.status === 400 || f?.status === 413) return `Layanan push menolak permintaan${via}, kode ${f.status}.`
  if (f?.status) return `Layanan push menjawab kode ${f.status}${via}. Coba lagi beberapa saat.`
  if (f?.error && /vapid|jwk|key|kunci/i.test(f.error)) return `Kunci VAPID tidak bisa dipakai${via}: ${f.error}. Kunci publik harus 87 karakter dan kunci privat 43 karakter, tanpa spasi atau awalan "VAPID_...=".`
  return `Pengiriman gagal${via}: ${f?.error ?? 'penyebab tidak diketahui'}`
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
