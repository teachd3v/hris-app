// Halaman karyawan berisi data per-pengguna (butuh login), jangan dibuat statis/di-cache.
// Halaman statis ikut tersimpan di cache sehingga setelah deploy klien bisa menjalankan
// JavaScript versi lama yang server action-nya sudah tidak dikenal server.
export const dynamic = 'force-dynamic'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return children
}
