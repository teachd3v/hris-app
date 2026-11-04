// Aman diimpor dari komponen klien (tanpa dependensi server).
/** Aksi yang dicatat. Label tampilan ada di AUDIT_ACTION_LABELS. */
export const AUDIT_ACTION_LABELS = {
  'employee.create': 'Tambah karyawan',
  'employee.delete': 'Hapus akun',
  'password.reset': 'Reset password',
  'role.change': 'Ubah peran',
  'account.approval': 'Ubah status akun',
  'manager.set': 'Ubah atasan',
  'employee.update': 'Ubah data karyawan',
  'leave.manager_decision': 'Keputusan atasan (cuti)',
  'leave.hc_decision': 'Keputusan HC (cuti)',
  'leave.hc_override': 'Ambil alih HC (cuti tertahan di atasan)',
  'quota.update': 'Ubah kuota cuti',
  'holiday.save': 'Simpan hari libur',
  'holiday.delete': 'Hapus hari libur',
  'auth.lockout': 'Akun terkunci (salah password)',
  'document.access': 'Buka/unduh dokumen pribadi',
  'export.data': 'Ekspor data',
} as const

export type AuditAction = keyof typeof AUDIT_ACTION_LABELS
