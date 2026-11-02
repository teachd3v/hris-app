import { headers } from 'next/headers'
import * as schema from '@/lib/db/schema'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>

import { AUDIT_ACTION_LABELS, type AuditAction } from '@/lib/audit-labels'

export { AUDIT_ACTION_LABELS }
export type { AuditAction }

export interface AuditActor {
  id?: string | null
  name?: string | null
  email?: string | null
}

export interface AuditEntry {
  action: AuditAction
  targetType?: string
  targetId?: string | null
  targetLabel?: string | null
  details?: Record<string, unknown>
  /** IP klien; bila kosong diambil dari header permintaan saat ini. */
  ip?: string | null
}

export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || null
  } catch {
    return null
  }
}

/**
 * Pernyataan INSERT log audit, untuk disertakan di db.batch([aksi, ...(await auditStmt(...))]) sehingga
 * log dan perubahan datanya atomik: kalau aksi gagal, log tidak ada; kalau log gagal, aksi dibatalkan.
 *
 * Mengembalikan ARRAY berisi satu pernyataan, bukan pernyataannya langsung: query builder Drizzle bersifat
 * "thenable", jadi bila dikembalikan dari fungsi async ia langsung DIJALANKAN (di luar batch).
 */
export async function auditStmt(db: Db, actor: AuditActor | null, entry: AuditEntry) {
  const stmt = db.insert(schema.audit_log).values({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor_id: actor?.id ?? null,
    actor_name: actor?.name ?? null,
    actor_email: actor?.email ?? null,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    target_label: entry.targetLabel ?? null,
    details: entry.details ? JSON.stringify(entry.details) : null,
    ip: entry.ip !== undefined ? entry.ip : await clientIp(),
  })
  return [stmt]
}

/** Catat satu entri tanpa transaksi (mis. unduhan dokumen, ekspor, akun terkunci). */
export async function recordAudit(db: Db, actor: AuditActor | null, entry: AuditEntry) {
  const [stmt] = await auditStmt(db, actor, entry)
  await stmt
}
