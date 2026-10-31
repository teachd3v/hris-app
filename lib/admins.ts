// Satu-satunya sumber kebenaran siapa yang admin.
// Admin = kolom employees.role === 'Admin', ATAU email ada di daftar bootstrap di bawah.
// Pengecekan hanya dilakukan di server (auth.ts -> session.user.isAdmin); klien cukup membaca flag itu.
export const ADMIN_EMAILS = [
  'teachgen2025@gmail.com',
  'teach.d3v@gmail.com',
  'hudagraph@gmail.com',
  'n.widodo@dompetdhuafa.org',
  'zulfa.nur@dompetdhuafa.org',
  'haryo@dompetdhuafa.org',
]

export function isAdminEmployee(
  emp: { role?: string | null; email?: string | null; institutional_email?: string | null },
  sessionEmail?: string | null,
) {
  if (emp.role === 'Admin') return true
  const emails = [emp.email, emp.institutional_email, sessionEmail].map((e) => (e || '').toLowerCase().trim())
  return ADMIN_EMAILS.some((a) => emails.includes(a.toLowerCase()))
}
