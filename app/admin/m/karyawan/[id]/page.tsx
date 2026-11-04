import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { eq } from "drizzle-orm";
import MobileAdminShell from "@/components/admin/MobileAdminShell";
import ResetPasswordButton from "@/components/admin/ResetPasswordButton";
import { requireAdmin } from "@/lib/auth-guard";
import { isAdminEmployee, isSuperAdminEmployee } from "@/lib/admins";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—");

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile, isSuperAdmin } = await requireAdmin();
  const db = getDb();

  const [emp] = await db.select().from(schema.employees).where(eq(schema.employees.id, id)).limit(1);
  if (!emp) notFound();
  let managerName: string | null = null;
  if (emp.manager_id) {
    const [m] = await db.select({ name: schema.employees.name }).from(schema.employees).where(eq(schema.employees.id, emp.manager_id)).limit(1);
    managerName = m?.name ?? null;
  }

  // Aturan sama dengan versi desktop: akun admin hanya dikelola super admin; akun super admin tidak dapat diubah
  const targetIsSuper = isSuperAdminEmployee(emp);
  const canManage = !targetIsSuper && (isSuperAdmin || !isAdminEmployee(emp));

  // Hanya data dasar & kontak. NIK, rekening, alamat, keluarga, dan dokumen hanya di versi desktop.
  const fields: [string, string | null][] = [
    ["No. Induk", emp.employee_code],
    ["Jabatan", emp.title],
    ["Departemen", emp.dept],
    ["Level", emp.level],
    ["Status kepegawaian", emp.status],
    ["Atasan langsung", managerName],
    ["Tanggal masuk", emp.join_date ? fmtDate(emp.join_date) : null],
    ["Email", emp.email],
    ["Email lembaga", emp.institutional_email],
    ["Telepon", emp.phone],
    ["Peran", emp.role === "Admin" ? "Admin" : "Karyawan"],
    ["Status akun", emp.approval_status || "Approved"],
  ];

  return (
    <MobileAdminShell title={emp.name || "Karyawan"} subtitle={[emp.title, emp.dept].filter(Boolean).join(" • ") || undefined} backHref="/admin/m/karyawan" backLabel="Kembali ke daftar karyawan" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}
      action={isSuperAdmin ? (
        <Link href={`/admin/m/karyawan/${emp.id}/edit`} aria-label="Ubah data karyawan" className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"><Pencil size={18} strokeWidth={2.5} /></Link>
      ) : undefined}
    >
      <div className="bg-white rounded-[20px] border border-[var(--line)] divide-y divide-line-2 overflow-hidden">
        {fields.map(([label, value]) => (
          <div key={label} className="px-4 py-3 flex items-start justify-between gap-4">
            <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider shrink-0">{label}</span>
            <span className="text-[13px] font-semibold text-ink text-right break-words min-w-0">{value || "—"}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[20px] border border-[var(--line)] p-4 flex flex-col gap-2">
        <h2 className="text-[13px] font-black text-ink">Reset password</h2>
        {canManage ? (
          <>
            <p className="text-[11px] text-ink-3">Untuk karyawan yang lupa password. Password dikembalikan ke default dan sesi login aktifnya dikeluarkan. Tindakan ini dicatat di log audit.</p>
            <div className="flex flex-col gap-2 items-start"><ResetPasswordButton employeeId={emp.id} employeeName={emp.name || emp.email || "karyawan"} /></div>
          </>
        ) : (
          <p className="text-[11px] text-ink-3">{targetIsSuper ? "Akun super admin tidak dapat direset dari sini." : "Akun admin hanya dapat direset oleh super admin."}</p>
        )}
      </div>

      <p className="text-[11px] text-ink-3 px-1">Data lengkap (NIK, rekening, alamat, keluarga, dokumen) dan pengelolaan akun hanya tersedia di desktop.</p>
    </MobileAdminShell>
  );
}
