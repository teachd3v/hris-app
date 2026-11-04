import MobileAdminShell from "@/components/admin/MobileAdminShell";
import MobileEmployeeList from "@/components/admin/MobileEmployeeList";
import { requireAdmin } from "@/lib/auth-guard";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, profile, isSuperAdmin } = await requireAdmin();
  const rows = await getDb()
    .select({ id: schema.employees.id, name: schema.employees.name, title: schema.employees.title, dept: schema.employees.dept, email: schema.employees.email, role: schema.employees.role, approval_status: schema.employees.approval_status })
    .from(schema.employees)
    .orderBy(schema.employees.name);

  return (
    <MobileAdminShell title="Karyawan" subtitle={isSuperAdmin ? "Ketuk nama untuk detail dan ubah data" : "Hanya baca"} backHref="/admin/m" backLabel="Kembali ke Menu Admin" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}>
      <MobileEmployeeList employees={rows} />
    </MobileAdminShell>
  );
}
