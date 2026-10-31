// Presensi memakai tanggal Waktu Indonesia Barat (UTC+7), bukan UTC.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export function todayWIB(now: Date = new Date()): string {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)
}
