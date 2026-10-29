import DashboardLayout from "@/components/common/DashboardLayout";
import LeaveRequestsAdmin from "@/components/admin/LeaveRequestsAdmin";
import { requireAdmin } from "@/lib/auth-guard";
import { ADMIN_MENU } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, profile } = await requireAdmin();
  const name = profile?.name || user.email?.split("@")[0] || "Admin";

  return (
    <DashboardLayout
      role="Admin"
      userName={name}
      userInitials={name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
      userPhoto={profile?.photo_url ?? undefined}
      menuSections={ADMIN_MENU}
    >
      <LeaveRequestsAdmin />
    </DashboardLayout>
  );
}
