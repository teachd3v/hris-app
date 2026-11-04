'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import MobileHeroShell from '@/components/common/MobileHeroShell';
import ApprovalList from '@/components/cuti/ApprovalList';
import { EMPLOYEE_MENU } from '@/lib/navigation';
import { isHcOverride } from '@/lib/leave';
import { getEmployeeBasicProfile } from '@/app/employee/documents/actions';
import { approveByManager, getManagerApprovals, getManagerHistory, type LeaveRequest } from '@/app/employee/cuti/actions';

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS: Record<string, { text: string; cls: string }> = {
  PENDING_HC_ADMIN: { text: 'Menunggu HC', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  APPROVED: { text: 'Disetujui', cls: 'bg-green-50 text-green-600 border-green-100' },
  REJECTED: { text: 'Ditolak', cls: 'bg-red-50 text-red-600 border-red-100' },
};

export default function ApprovalPage() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [profile, setProfile] = useState<{ name: string | null; photo_url: string | null } | null>(null);
  const [pending, setPending] = useState<LeaveRequest[] | null>(null);
  const [history, setHistory] = useState<LeaveRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([getManagerApprovals(), getManagerHistory()]);
      setPending(p);
      setHistory(h);
    } catch {
      setError('Gagal memuat data persetujuan');
    }
  }, []);

  useEffect(() => { getEmployeeBasicProfile().then(setProfile).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const name = profile?.name || 'Memuat...';
  const loading = !error && (pending === null || history === null);

  return (
    <MobileHeroShell
      role="Karyawan"
      menuSections={EMPLOYEE_MENU}
      eyebrow="Atasan"
      title="Persetujuan Cuti"
      subtitle="Pengajuan bawahan langsung Anda"
      backHref="/employee/dashboard"
      backLabel="Kembali ke beranda"
      userName={name}
      userPhoto={profile?.photo_url ?? undefined}
    >
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
      ) : pending && history ? (
        <>
          <div className="bg-white rounded-full border border-[var(--line)] p-1 flex gap-1 shadow-sm">
            {([['pending', `Menunggu (${pending.length})`], ['history', 'Riwayat']] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)} className={`flex-1 h-10 rounded-full text-[12px] font-black transition-colors ${tab === key ? 'bg-[var(--red)] text-white' : 'text-ink-2'}`}>{label}</button>
            ))}
          </div>

          <div className="bg-white rounded-[20px] border border-[var(--line)] p-3 md:p-5">
            {tab === 'pending' ? (
              <ApprovalList
                requests={pending}
                emptyText="Tidak ada pengajuan bawahan yang menunggu persetujuan Anda."
                onDecide={async (id, approve, notes) => {
                  const res = await approveByManager(id, approve, notes);
                  if (!res.error) await load();
                  return res;
                }}
              />
            ) : history.length === 0 ? (
              <p className="text-[12px] text-ink-3 py-6 text-center">Belum ada riwayat keputusan.</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((r) => {
                  const who = (r as any).employees?.name || r.employee_name || 'Karyawan';
                  const st = STATUS[r.status] ?? { text: r.status, cls: 'bg-gray-50 text-gray-500 border-gray-100' };
                  const override = isHcOverride(r);
                  return (
                    <div key={r.id} data-testid="history-row" className="border border-line rounded-2xl p-3.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-extrabold text-ink truncate">{who}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border shrink-0 ${st.cls}`}>{st.text}</span>
                      </div>
                      <p className="text-[12px] text-ink-2">
                        <span className="font-bold">{r.leave_type}</span> · {fmt(r.start_date)} - {fmt(r.end_date)} <span className="text-ink-3">({r.duration_days} hari)</span>
                      </p>
                      {override ? (
                        <p className="text-[11px] font-bold text-orange-700">Diambil alih HC. {r.hc_notes?.replace(/^Ambil alih HC: /, 'Alasan: ')}</p>
                      ) : (
                        <p className="text-[11px] text-ink-3">
                          Keputusan Anda{r.manager_approved_at ? ` · ${fmt(r.manager_approved_at)}` : ''}
                          {r.manager_notes ? ` · “${r.manager_notes}”` : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </MobileHeroShell>
  );
}
