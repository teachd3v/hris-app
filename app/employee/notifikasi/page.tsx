'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2 } from 'lucide-react';
import MobileHeroShell from '@/components/common/MobileHeroShell';
import { NOTIFICATIONS_CHANGED } from '@/components/common/NotificationBell';
import PushToggle from '@/components/common/PushToggle';
import { EMPLOYEE_MENU } from '@/lib/navigation';
import { getEmployeeBasicProfile } from '@/app/employee/documents/actions';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from './actions';

/** "baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu", atau tanggal bila lebih dari seminggu. */
function ago(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string | null; photo_url: string | null } | null>(null);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await getMyNotifications());
    } catch {
      setError('Gagal memuat notifikasi');
    }
  }, []);

  useEffect(() => { getEmployeeBasicProfile().then(setProfile).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const unread = (items ?? []).filter((n) => !n.read_at).length;

  const open = async (n: NotificationItem) => {
    if (!n.read_at) {
      await markNotificationRead(n.id).catch(() => {});
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    }
    if (n.href) router.push(n.href);
    else await load();
  };

  const readAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    await load();
  };

  return (
    <MobileHeroShell
      role="Karyawan"
      menuSections={EMPLOYEE_MENU}
      eyebrow="Akun"
      title="Notifikasi"
      subtitle={items ? (unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca') : undefined}
      backHref="/employee/dashboard"
      backLabel="Kembali ke beranda"
      userName={profile?.name || 'Memuat...'}
      userPhoto={profile?.photo_url ?? undefined}
    >
      <PushToggle variant="row" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!items && !error ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
      ) : items ? (
        <>
          {unread > 0 && (
            <div className="flex justify-end">
              <button type="button" onClick={readAll} className="text-[12px] font-bold text-[var(--red)] px-1">Tandai semua dibaca</button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-[var(--line)] p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center text-ink-3"><Bell size={22} /></div>
              <h2 className="text-[15px] font-black text-ink">Belum ada notifikasi</h2>
              <p className="text-[12px] text-ink-3 mt-1">Pengajuan cuti dan keputusannya akan muncul di sini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((n) => (
                <button key={n.id} type="button" data-testid="notification-row" onClick={() => open(n)} className={`text-left rounded-[18px] border p-3.5 flex gap-3 items-start active:scale-[0.99] transition-transform ${n.read_at ? 'bg-white border-[var(--line)]' : 'bg-red-50/60 border-red-100'}`}>
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-[var(--red)]'}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] text-ink ${n.read_at ? 'font-bold' : 'font-black'}`}>{n.title}</span>
                    {n.body && <span className="block text-[12px] text-ink-2 mt-0.5 leading-snug">{n.body}</span>}
                    <span className="block text-[10px] text-ink-3 mt-1">{ago(n.created_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
    </MobileHeroShell>
  );
}
