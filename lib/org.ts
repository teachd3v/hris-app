// Struktur organisasi: semua karyawan wajib punya atasan langsung, kecuali pucuk pimpinan.
export const TOP_LEADER = { name: 'Haryo Mojopahit', email: 'haryo@dompetdhuafa.org' }

export const normalizeName = (s: string | null | undefined) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()

export function isTopLeader(e: { name?: string | null; email?: string | null; institutional_email?: string | null }) {
  return (
    normalizeName(e.name) === normalizeName(TOP_LEADER.name) ||
    [e.email, e.institutional_email].some((m) => (m || '').toLowerCase().trim() === TOP_LEADER.email)
  )
}
