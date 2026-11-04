import { redirect } from "next/navigation";
import MobileAdminShell from "@/components/admin/MobileAdminShell";
import MobileQuotaList from "@/components/admin/MobileQuotaList";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, profile, isSuperAdmin } = await requireAdmin();
  // Versi HP hanya untuk super admin; admin lain memakai halaman desktop
  if (!isSuperAdmin) redirect("/admin/m");

  return (
    <MobileAdminShell title="Kuota Cuti" subtitle="Atur jatah cuti per karyawan" backHref="/admin/m" backLabel="Kembali ke Menu Admin" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}>
      <MobileQuotaList />
    </MobileAdminShell>
  );
}
