'use server'

import { getAdminContext } from '@/lib/auth-guard'
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { recordAudit } from '@/lib/audit'
import { AUDIT_ACTION_LABELS } from '@/lib/audit-labels'
import { and, desc, eq, gte, lt, like, or, sql } from 'drizzle-orm'

const EXPORT_KINDS = ['employees-xlsx', 'assessment-recap-xlsx', 'assessment-report-pdf'] as const

/**
 * Catat ekspor data (berkas dibuat di browser, jadi dicatat lebih dulu oleh klien).
 * Klien menunggu hasilnya: bila pencatatan gagal, ekspor dibatalkan.
 */
export async function logExport(
  kind: string,
  info: { rows?: number; label?: string },
): Promise<{ error?: string }> {
  const admin = await getAdminContext()
  if (!admin) return { error: 'Unauthorized' }
  if (!EXPORT_KINDS.includes(kind as (typeof EXPORT_KINDS)[number])) return { error: 'Jenis ekspor tidak valid' }

  await recordAudit(getDb(), { id: admin.emp.id, name: admin.emp.name, email: admin.emp.email }, {
    action: 'export.data',
    targetType: 'export',
    targetLabel: String(info?.label ?? '').slice(0, 200) || null,
    details: { kind, rows: Number.isFinite(info?.rows) ? info.rows : undefined },
  })
  return {}
}

export interface AuditLogRow {
  id: string
  at: string
  actor_name: string | null
  actor_email: string | null
  action: string
  target_type: string | null
  target_label: string | null
  details: Record<string, unknown> | null
  ip: string | null
}

export interface AuditFilters {
  action?: string
  actor?: string
  from?: string // YYYY-MM-DD (WIB)
  to?: string // YYYY-MM-DD (WIB, inklusif)
}

const PAGE = 50
const wibStart = (d: string) => new Date(`${d}T00:00:00+07:00`).toISOString()

/** Hanya super admin. Urut terbaru dulu; `before` = penunjuk halaman berikutnya. */
export async function listAuditLogs(
  filters: AuditFilters,
  before?: { at: string; id: string } | null,
): Promise<{ rows: AuditLogRow[]; next: { at: string; id: string } | null; error?: string }> {
  const admin = await getAdminContext()
  if (!admin?.isSuperAdmin) return { rows: [], next: null, error: 'Hanya super admin yang dapat melihat log audit' }
  const db = getDb()

  const conds = []
  if (filters.action && filters.action in AUDIT_ACTION_LABELS) conds.push(eq(schema.audit_log.action, filters.action))
  const actor = (filters.actor ?? '').trim().slice(0, 100)
  if (actor) {
    const q = `%${actor.replace(/[%_]/g, '')}%`
    conds.push(or(like(schema.audit_log.actor_name, q), like(schema.audit_log.actor_email, q))!)
  }
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) conds.push(gte(schema.audit_log.at, wibStart(filters.from)))
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    const end = new Date(wibStart(filters.to)); end.setUTCDate(end.getUTCDate() + 1)
    conds.push(lt(schema.audit_log.at, end.toISOString()))
  }
  if (before) conds.push(or(lt(schema.audit_log.at, before.at), and(eq(schema.audit_log.at, before.at), lt(schema.audit_log.id, before.id)))!)

  const rows = await db
    .select()
    .from(schema.audit_log)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.audit_log.at), desc(schema.audit_log.id))
    .limit(PAGE + 1)

  const page = rows.slice(0, PAGE)
  const last = page[page.length - 1]
  return {
    rows: page.map((r) => ({
      id: r.id, at: r.at, actor_name: r.actor_name, actor_email: r.actor_email, action: r.action,
      target_type: r.target_type, target_label: r.target_label, ip: r.ip,
      details: r.details ? (JSON.parse(r.details) as Record<string, unknown>) : null,
    })),
    next: rows.length > PAGE && last ? { at: last.at, id: last.id } : null,
  }
}
