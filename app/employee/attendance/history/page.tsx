'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/common/DashboardLayout';
import { EMPLOYEE_MENU } from '@/lib/navigation';
import { getEmployeeBasicProfile } from '@/app/employee/documents/actions';
import { getMyAttendanceHistory, type AttendanceHistory, type AttendanceHistoryDay } from '../actions';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const STATUS: Record<AttendanceHistoryDay['status'], { label: string; cls: string }> = {
  HADIR: { label: 'Hadir', cls: 'bg-green-50 text-green-700 border-green-100' },
  BELUM_PULANG: { label: 'Belum pulang', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  TIDAK_CLOCK_OUT: { label: 'Tidak clock-out', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  CUTI: { label: 'Cuti', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  LIBUR: { label: 'Libur', cls: 'bg-gray-50 text-gray-500 border-gray-100' },
  BELUM_HADIR: { label: 'Belum presensi', cls: 'bg-orange-50 text-orange-700 border-orange-100' },
  TIDAK_HADIR: { label: 'Tidak ada presensi', cls: 'bg-gray-50 text-gray-500 border-gray-100' },
  TIDAK_ADA: { label: 'Tidak ada presensi', cls: 'bg-gray-50 text-gray-500 border-gray-100' },
  BELUM_WAKTUNYA: { label: '—', cls: 'bg-gray-50 text-gray-400 border-gray-100' },
};

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':') : '--:--');
const fmtDay = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const hours = (h: number) => `${Math.floor(h)} j ${Math.round((h % 1) * 60)} m`;

export default function AttendanceHistoryPage() {
  const nowWib = new Date(Date.now() + 7 * 3600_000);
  const [year, setYear] = useState(nowWib.getUTCFullYear());
  const [month, setMonth] = useState(nowWib.getUTCMonth() + 1);
  const [data, setData] = useState<AttendanceHistory | null>(null);
  const [profile, setProfile] = useState<{ name: string | null; photo_url: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCurrentMonth = year === nowWib.getUTCFullYear() && month === nowWib.getUTCMonth() + 1;
  const today = nowWib.toISOString().slice(0, 10);

  useEffect(() => { getEmployeeBasicProfile().then(setProfile).catch(() => {}); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setData(null);
      setError(null);
      try {
        const res = await getMyAttendanceHistory(year, month);
        if (cancelled) return;
        if (res.error) return setError(res.error);
        setData(res);
      } catch {
        if (!cancelled) setError('Gagal memuat riwayat presensi');
      }
    })();
    return () => { cancelled = true; };
  }, [year, month]);

  const move = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth() + 1);
  };

  const s = data?.summary;
  const name = profile?.name || 'Memuat...';

  return (
    <DashboardLayout
      role="Karyawan"
      userName={name}
      userInitials={profile?.name ? profile.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
      userPhoto={profile?.photo_url ?? undefined}
      menuSections={EMPLOYEE_MENU}
      hideTopbar
      hideBottomNav
      noPadding
    >
      <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)] md:bg-transparent pb-8">
        <div className="relative pt-5 pb-12 px-6 bg-[var(--red)] text-white rounded-b-[40px] md:hidden overflow-hidden shadow-md shrink-0">
          <Link href="/employee/dashboard" aria-label="Kembali ke beranda" className="absolute top-5 left-6 z-20 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"><Home size={18} strokeWidth={2.5} /></Link>
          <h1 className="relative z-10 text-center text-white/90 text-[14px] font-bold tracking-widest uppercase mt-2">Riwayat Presensi</h1>
        </div>

        <div className="hidden md:block page-head px-5 pt-5">
          <span className="eyebrow">Presensi</span>
          <h1 className="text-ink">Riwayat Presensi</h1>
          <p className="text-ink-3">Jam masuk, jam pulang, dan durasi kerja Anda. Clock in/out hanya dapat dilakukan dari HP.</p>
        </div>

        <div className="relative z-20 px-4 md:px-5 -mt-6 md:mt-0 flex flex-col gap-3 md:gap-4">
          <div className="bg-white rounded-[20px] border border-[var(--line)] p-3 md:p-4 flex items-center justify-between shadow-sm">
            <button type="button" aria-label="Bulan sebelumnya" onClick={() => move(-1)} className="w-9 h-9 rounded-xl border border-line-2 flex items-center justify-center"><ChevronLeft size={18} /></button>
            <div className="text-[14px] font-black text-ink">{MONTHS[month - 1]} {year}</div>
            <button type="button" aria-label="Bulan berikutnya" onClick={() => move(1)} disabled={isCurrentMonth} className="w-9 h-9 rounded-xl border border-line-2 flex items-center justify-center disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {!data && !error ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
          ) : data && s ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3" data-testid="summary">
                {[
                  ['Hari hadir', String(s.presentDays), 'text-green-700'],
                  ['Total jam', s.totalHours > 0 ? hours(s.totalHours) : '—', 'text-ink'],
                  ['Rata-rata / hari', s.avgHours != null ? hours(s.avgHours) : '—', 'text-ink'],
                  ['Hari cuti', String(s.leaveDays), 'text-indigo-700'],
                ].map(([label, value, cls]) => (
                  <div key={label} className="bg-white rounded-[16px] border border-[var(--line)] p-3 text-center">
                    <div className={`text-lg md:text-xl font-black ${cls}`}>{value}</div>
                    <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
              {s.missingClockOut > 0 && (
                <p className="text-[12px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  {s.missingClockOut} hari tanpa clock-out pada bulan ini. Pastikan selalu clock-out saat pulang.
                </p>
              )}

              {data.days.length === 0 ? (
                <p className="text-sm text-ink-3 text-center py-8">Belum ada data untuk bulan ini.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.days.map((d) => {
                    const st = STATUS[d.status];
                    const dim = d.status === 'LIBUR';
                    return (
                      <div key={d.date} data-testid="day-row" className={`bg-white rounded-[16px] border p-3 flex items-center justify-between gap-3 ${d.date === today ? 'border-[var(--red)]' : 'border-[var(--line)]'} ${dim ? 'opacity-70' : ''}`}>
                        <div className="min-w-0">
                          <div className="text-[13px] font-extrabold text-ink">{fmtDay(d.date)}{d.date === today && <span className="ml-2 text-[10px] font-black text-[var(--red)]">HARI INI</span>}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${st.cls}`}>{st.label}{d.detail ? ` · ${d.detail}` : ''}</span>
                        </div>
                        {(d.clock_in || d.clock_out) && (
                          <div className="text-right shrink-0 text-[12px]">
                            <div className="font-bold text-ink-2">{fmtTime(d.clock_in)} – {fmtTime(d.clock_out)}</div>
                            {d.duration_hours != null && <div className="text-ink-3 text-[11px]">{hours(d.duration_hours)}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
