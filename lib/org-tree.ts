import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'
import type { getDb } from '@/lib/db'

type Db = ReturnType<typeof getDb>

export interface OrgMember {
  id: string
  name: string
  title: string | null
  dept: string | null
  manager_id: string | null
  managerName: string | null
  /** 1 = bawahan langsung, 2 = bawahan dari bawahan, dst. */
  level: number
}

/** Seluruh turunan (bawahan langsung dan tidak langsung) dari seorang atasan. Aman terhadap rantai melingkar. */
export async function getSubordinates(db: Db, managerId: string): Promise<OrgMember[]> {
  const all = await db
    .select({ id: schema.employees.id, name: schema.employees.name, title: schema.employees.title, dept: schema.employees.dept, manager_id: schema.employees.manager_id, approval_status: schema.employees.approval_status })
    .from(schema.employees)

  const nameOf = new Map(all.map((e) => [e.id, e.name ?? '']))
  const children = new Map<string, typeof all>()
  for (const e of all) {
    if (!e.manager_id || e.approval_status === 'Rejected') continue
    children.set(e.manager_id, [...(children.get(e.manager_id) ?? []), e])
  }

  const out: OrgMember[] = []
  const seen = new Set<string>([managerId])
  let frontier = [managerId]
  for (let level = 1; frontier.length > 0 && level < 50; level++) {
    const next: string[] = []
    for (const parent of frontier) {
      for (const c of children.get(parent) ?? []) {
        if (seen.has(c.id)) continue
        seen.add(c.id)
        next.push(c.id)
        out.push({ id: c.id, name: c.name ?? '(tanpa nama)', title: c.title, dept: c.dept, manager_id: c.manager_id, managerName: nameOf.get(parent) || null, level })
      }
    }
    frontier = next
  }
  return out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
}

/** Cepat: apakah punya bawahan langsung? (untuk menampilkan menu "Tim Saya") */
export async function hasSubordinates(db: Db, managerId: string): Promise<boolean> {
  const rows = await db.select({ id: schema.employees.id }).from(schema.employees).where(eq(schema.employees.manager_id, managerId)).limit(1)
  return rows.length > 0
}
