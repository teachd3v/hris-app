// Status presensi satu orang pada satu tanggal. Dipakai presensi tim (atasan) dan riwayat presensi sendiri,
// agar kedua tampilan selalu sepakat.
export type DayStatus =
  | 'HADIR'
  | 'BELUM_PULANG'
  | 'TIDAK_CLOCK_OUT'
  | 'CUTI'
  | 'LIBUR'
  | 'BELUM_HADIR'
  | 'TIDAK_HADIR'
  | 'BELUM_WAKTUNYA'

export function dayStatus(opts: {
  date: string
  today: string
  /** Hari non-kerja: Sabtu, Minggu, atau libur terdaftar */
  offDay: boolean
  offLabel?: string | null
  clockIn?: string | null
  clockOut?: string | null
  leaveType?: string | null
}): { status: DayStatus; detail: string | null } {
  const { date, today, offDay, offLabel, clockIn, clockOut, leaveType } = opts
  if (clockIn) {
    return { status: clockOut ? 'HADIR' : date === today ? 'BELUM_PULANG' : 'TIDAK_CLOCK_OUT', detail: null }
  }
  if (leaveType) return { status: 'CUTI', detail: leaveType }
  if (offDay) return { status: 'LIBUR', detail: offLabel ?? null }
  if (date > today) return { status: 'BELUM_WAKTUNYA', detail: null }
  return { status: date === today ? 'BELUM_HADIR' : 'TIDAK_HADIR', detail: null }
}
