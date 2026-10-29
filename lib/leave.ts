// Aturan cuti yang dipakai bersama oleh klien (form) dan server (validasi).
export type LeaveCategory =
  | 'Cuti Tahunan'
  | 'Cuti Ayah'
  | 'Cuti Berkabung'
  | 'Cuti Melahirkan'
  | 'Cuti Pernikahan'
  | 'Cuti Unpaid'
  | 'Sakit'
  | 'Ganti Hari'
  | 'Izin Terlambat'
  | 'Izin Pulang Cepat'
  | 'Dinas Luar Kota';

export const LEAVE_TYPES: {
  key: LeaveCategory;
  label: string;
  desc: string;
  requiresAttachment?: boolean;
  timeBased?: boolean;
  gender?: 'Laki-laki' | 'Perempuan';
}[] = [
  { key: 'Cuti Tahunan', label: 'Cuti Tahunan', desc: 'Mengurangi jatah cuti tahunan reguler.' },
  { key: 'Cuti Ayah', label: 'Cuti Ayah', desc: 'Khusus karyawan laki-laki untuk kelahiran anak.', gender: 'Laki-laki' },
  { key: 'Cuti Berkabung', label: 'Cuti Berkabung', desc: 'Untuk duka cita keluarga inti wafat.' },
  { key: 'Cuti Melahirkan', label: 'Cuti Melahirkan', desc: 'Khusus karyawan perempuan.', gender: 'Perempuan' },
  { key: 'Cuti Pernikahan', label: 'Cuti Pernikahan', desc: 'Untuk hari pernikahan karyawan.' },
  { key: 'Cuti Unpaid', label: 'Cuti Diluar Tanggungan (Unpaid)', desc: 'Tidak memotong kuota tahunan, gaji dipotong.' },
  { key: 'Sakit', label: 'Izin Sakit', desc: 'Memerlukan surat keterangan dokter.', requiresAttachment: true },
  { key: 'Ganti Hari', label: 'Ganti Hari', desc: 'Mengambil kompensasi dari masuk di hari libur.' },
  { key: 'Izin Terlambat', label: 'Izin Keterlambatan masuk', desc: 'Memerlukan detail jam estimasi kehadiran.', timeBased: true },
  { key: 'Izin Pulang Cepat', label: 'Izin Pulang Cepat', desc: 'Memerlukan detail jam estimasi pulang.', timeBased: true },
  { key: 'Dinas Luar Kota', label: 'Dinas Luar Kota / SPD', desc: 'Perjalanan dinas resmi luar kota.' },
];

export const LEAVE_TYPE_KEYS = LEAVE_TYPES.map((t) => t.key);

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseIsoDate(s: string): Date | null {
  if (!ISO_DATE.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

/** Durasi dalam hari: izin jam-jaman = 1, melahirkan = hari kalender, selain itu hari kerja (Senin-Jumat). */
export function calculateLeaveDuration(type: LeaveCategory, start: string, end: string): number {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (!s || !e || s > e) return 0;

  if (type === 'Izin Terlambat' || type === 'Izin Pulang Cepat') return 1;
  if (type === 'Cuti Melahirkan') return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;

  let days = 0;
  for (const d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
  }
  return days;
}
