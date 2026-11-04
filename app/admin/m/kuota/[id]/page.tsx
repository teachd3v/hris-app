import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import MobileAdminShell from "@/components/admin/MobileAdminShell";
import MobileQuotaEditor from "@/components/admin/MobileQuotaEditor";
import { requireAdmin } from "@/lib/auth-guard";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tahun?: string }> }) {
  const { id } = await params;
  const { tahun } = await searchParams;
  const { user, profile, isSuperAdmin } = await requireAdmin();
  if (!isSuperAdmin) redirect("/admin/m");

  const parsed = Number(tahun);
  const year = Number.isInteger(parsed) && parsed >= 2020 && parsed <= 2100 ? parsed : new Date().getFullYear();

  const [emp] = await getDb().select({ id: schema.employees.id, name: schema.employees.name, email: schema.employees.email }).from(schema.employees).where(eq(schema.employees.id, id)).limit(1);
  if (!emp) notFound();

  return (
    <MobileAdminShell title={emp.name || emp.email || "Karyawan"} subtitle={`Jatah cuti tahun ${year}`} backHref="/admin/m/kuota" backLabel="Kembali ke daftar kuota" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}>
      <MobileQuotaEditor employeeId={emp.id} year={year} />
    </MobileAdminShell>
  );
}
