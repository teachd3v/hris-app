// Pilihan data kepegawaian; dipakai form profil karyawan dan edit oleh super admin agar seragam.
export const DEPT_OPTIONS = [
  { value: "IDEAS", label: "IDEAS" },
  { value: "SGLT", label: "SGLT" },
  { value: "BI", label: "BI" },
  { value: "Budaya", label: "Budaya" },
  { value: "REMO", label: "REMO" },
  { value: "LSP", label: "LSP" },
];

export const LEVEL_OPTIONS = [
  { value: "Direktur", label: "Direktur" },
  { value: "Manajer", label: "Manajer" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Koordinator", label: "Koordinator" },
  { value: "Staff", label: "Staff" },
  { value: "Pelaksana", label: "Pelaksana" },
];

export const STATUS_OPTIONS = [
  { value: "Kontrak", label: "Kontrak" },
  { value: "Tetap", label: "Tetap" },
  { value: "Probation", label: "Probation" },
  { value: "Magang", label: "Magang" },
];

/** Masa kerja dalam teks ("2 Tahun 3 Bulan") dari tanggal masuk (YYYY-MM-DD); format sama dengan form profil. */
export function tenureFrom(join: string | null, now: Date = new Date()): string {
  if (!join) return "";
  const start = new Date(join);
  if (isNaN(start.getTime())) return "";
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0) parts.push(`${months} Bulan`);
  return parts.length > 0 ? parts.join(" ") : "Kurang dari 1 bulan";
}
