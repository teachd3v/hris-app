import MobileAdminShell from "@/components/admin/MobileAdminShell";
import MobileHcApprovals from "@/components/admin/MobileHcApprovals";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, profile } = await requireAdmin();
  return (
    <MobileAdminShell title="Persetujuan Cuti" subtitle="Tahap akhir (HC)" backHref="/admin/m" backLabel="Kembali ke Menu Admin" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}>
      <MobileHcApprovals />
    </MobileAdminShell>
  );
}
