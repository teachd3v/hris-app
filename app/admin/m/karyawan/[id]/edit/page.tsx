import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import MobileAdminShell from "@/components/admin/MobileAdminShell";
import MobileEmployeeEditForm from "@/components/admin/MobileEmployeeEditForm";
import { requireAdmin } from "@/lib/auth-guard";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile, isSuperAdmin } = await requireAdmin();
  // Hanya super admin; yang lain dikembalikan ke halaman detail (server action juga menolak)
  if (!isSuperAdmin) redirect(`/admin/m/karyawan/${id}`);

  const [emp] = await getDb().select().from(schema.employees).where(eq(schema.employees.id, id)).limit(1);
  if (!emp) notFound();

  return (
    <MobileAdminShell title="Ubah Data" subtitle={emp.name || undefined} backHref={`/admin/m/karyawan/${id}`} backLabel="Kembali ke detail karyawan" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}>
      <MobileEmployeeEditForm
        employeeId={emp.id}
        initial={{
          name: emp.name ?? "",
          employee_code: emp.employee_code ?? "",
          title: emp.title ?? "",
          dept: emp.dept ?? "",
          level: emp.level ?? "",
          status: emp.status ?? "",
          join_date: emp.join_date ? emp.join_date.slice(0, 10) : "",
          phone: emp.phone ?? "",
        }}
      />
    </MobileAdminShell>
  );
}
