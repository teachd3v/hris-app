// Satu-satunya sumber kebenaran siapa yang admin dan siapa super admin.
// Admin = kolom employees.role === 'Admin', ATAU email ada di daftar bootstrap di bawah.
// Super admin = pemilik/developer sistem: hanya dia yang boleh mengelola akun admin lain.
// Pengecekan dilakukan di server (auth.ts -> session.user.isAdmin / isSuperAdmin); klien cukup membaca flag itu.
export const SUPER_ADMIN_EMAILS = ['hudagraph@gmail.com']

export const ADMIN_EMAILS = [
  ...SUPER_ADMIN_EMAILS,
  'n.widodo@dompetdhuafa.org',
  'zulfa.nur@dompetdhuafa.org',
  'haryo@dompetdhuafa.org',
]

type EmpLike = { role?: string | null; email?: string | null; institutional_email?: string | null }

const emailsOf = (emp: EmpLike, sessionEmail?: string | null) =>
  [emp.email, emp.institutional_email, sessionEmail].map((e) => (e || '').toLowerCase().trim())

export function isAdminEmployee(emp: EmpLike, sessionEmail?: string | null) {
  if (emp.role === 'Admin') return true
  const emails = emailsOf(emp, sessionEmail)
  return ADMIN_EMAILS.some((a) => emails.includes(a.toLowerCase()))
}

export function isSuperAdminEmployee(emp: EmpLike, sessionEmail?: string | null) {
  const emails = emailsOf(emp, sessionEmail)
  return SUPER_ADMIN_EMAILS.some((a) => emails.includes(a.toLowerCase()))
}
