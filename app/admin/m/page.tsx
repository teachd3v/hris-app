import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { eq, count } from "drizzle-orm";
import MobileAdminShell from "@/components/admin/MobileAdminShell";
import { requireAdmin } from "@/lib/auth-guard";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, profile, isSuperAdmin } = await requireAdmin();
  const db = getDb();
  const [[pending], [stalled], [total]] = await Promise.all([
    db.select({ n: count() }).from(schema.leave_requests).where(eq(schema.leave_requests.status, "PENDING_HC_ADMIN")),
    db.select({ n: count() }).from(schema.leave_requests).where(eq(schema.leave_requests.status, "PENDING_DIRECT_MANAGER")),
    db.select({ n: count() }).from(schema.employees),
  ]);

  const items = [
    { href: "/admin/m/cuti", icon: "📅", title: "Persetujuan Cuti (HC)", desc: stalled.n > 0 ? `Setujui atau tolak pengajuan · ${stalled.n} tertahan di atasan` : "Setujui atau tolak pengajuan", badge: pending.n > 0 ? `${pending.n} menunggu` : null },
    { href: "/admin/m/karyawan", icon: "👥", title: "Karyawan", desc: isSuperAdmin ? `Lihat dan ubah data, reset password (${total.n} karyawan)` : `Lihat data & reset password (${total.n} karyawan)`, badge: null },
    // Pengaturan cuti dari HP: khusus super admin (admin lain memakai desktop)
    ...(isSuperAdmin ? [
      { href: "/admin/m/kuota", icon: "🗓️", title: "Kuota Cuti", desc: "Atur jatah cuti per karyawan", badge: null },
      { href: "/admin/m/libur", icon: "🎌", title: "Hari Libur", desc: "Libur nasional dan cuti bersama", badge: null },
    ] : []),
  ];

  return (
    <MobileAdminShell title="Menu Admin" subtitle="Aksi cepat dari HP" backHref="/employee/dashboard" backLabel="Kembali ke beranda" userName={profile?.name || user.email?.split("@")[0] || "Admin"} userPhoto={profile?.photo_url ?? undefined}>
      <div className="flex flex-col gap-2.5">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="bg-white rounded-[20px] border border-[var(--line)] p-4 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[22px] shrink-0">{it.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-ink">{it.title}</div>
              <div className="text-[11px] text-ink-3">{it.desc}</div>
            </div>
            {it.badge && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--red)] text-white shrink-0">{it.badge}</span>}
            <ChevronRight size={18} className="text-ink-3 shrink-0" />
          </Link>
        ))}
      </div>
      <p className="text-[11px] text-ink-3 px-1 leading-relaxed">
        Pengaturan lain (tambah/hapus karyawan, atasan, {isSuperAdmin ? "" : "kuota cuti, hari libur, "}asesmen, log audit) dan data lengkap karyawan tersedia di <strong>desktop</strong>.
      </p>
    </MobileAdminShell>
  );
}
