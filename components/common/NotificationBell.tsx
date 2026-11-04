"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/app/employee/notifikasi/actions";

export const NOTIFICATIONS_CHANGED = "notifications:changed";

/** Lonceng dengan badge jumlah notifikasi belum dibaca. Diperbarui saat dibuka, saat aplikasi kembali aktif, dan setelah ada yang dibaca. */
export default function NotificationBell({ variant }: { variant: "hero" | "topbar" }) {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    getUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
    };
  }, [refresh]);

  const label = unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi";
  const badge = unread > 0 && (
    <span data-testid="notification-badge" className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--yellow)] text-black text-[9px] font-black flex items-center justify-center leading-none">
      {unread > 9 ? "9+" : unread}
    </span>
  );

  if (variant === "hero") {
    return (
      <Link href="/employee/notifikasi" aria-label={label} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center relative shadow-sm border border-white/20 text-white">
        <Bell size={16} />
        {badge}
      </Link>
    );
  }
  return (
    <Link href="/employee/notifikasi" aria-label={label} title="Notifikasi" className="topbar-action relative">
      <Bell size={16} />
      {badge}
    </Link>
  );
}
