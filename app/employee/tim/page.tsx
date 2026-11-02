'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/common/DashboardLayout';
import TeamAttendance from '@/components/tim/TeamAttendance';
import TeamCalendar from '@/components/tim/TeamCalendar';
import { EMPLOYEE_MENU } from '@/lib/navigation';
import { getTeamOverview, type TeamMemberInfo } from './actions';

export default function TeamPage() {
  const [tab, setTab] = useState<'presensi' | 'kalender'>('presensi');
  const [name, setName] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMemberInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTeamOverview()
      .then((o) => { setName(o.name); setMembers(o.members); })
      .catch(() => setError('Gagal memuat data tim'));
  }, []);

  const tabs = [['presensi', 'Presensi Tim'], ['kalender', 'Kalender Cuti']] as const;

  return (
    <DashboardLayout
      role="Karyawan"
      userName={name || 'Memuat...'}
      userInitials={name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
      menuSections={EMPLOYEE_MENU}
      hideTopbar
      hideBottomNav
      noPadding
    >
      <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)] md:bg-transparent pb-8">
        {/* Mobile hero */}
        <div className="relative pt-5 pb-12 px-6 bg-[var(--red)] text-white rounded-b-[40px] md:hidden overflow-hidden shadow-md shrink-0">
          <Link href="/employee/dashboard" className="absolute top-5 left-6 z-20 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"><Home size={18} strokeWidth={2.5} /></Link>
          <h1 className="relative z-10 text-center text-white/90 text-[14px] font-bold tracking-widest uppercase mt-2">Tim Saya</h1>
          {members && <p className="relative z-10 text-center text-white/80 text-[11px] mt-1">{members.length} anggota (termasuk bawahan tidak langsung)</p>}
        </div>

        {/* Desktop header */}
        <div className="hidden md:block page-head px-5 pt-5">
          <span className="eyebrow">Atasan</span>
          <h1 className="text-ink">Tim Saya</h1>
          <p className="text-ink-3">Presensi dan jadwal cuti seluruh bawahan Anda{members ? ` (${members.length} orang)` : ''}.</p>
        </div>

        <div className="relative z-20 px-4 md:px-5 -mt-6 md:mt-0 flex flex-col gap-3 md:gap-5">
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {members === null && !error ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
          ) : members && members.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-[var(--line)] p-8 text-center">
              <div className="text-3xl mb-2">👥</div>
              <h2 className="text-[15px] font-black text-ink">Anda belum memiliki bawahan</h2>
              <p className="text-[12px] text-ink-3 mt-1">Halaman ini muncul untuk karyawan yang ditetapkan sebagai atasan langsung.</p>
            </div>
          ) : members ? (
            <>
              <div className="bg-white rounded-full border border-[var(--line)] p-1 flex gap-1 shadow-sm">
                {tabs.map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setTab(key)} className={`flex-1 h-10 rounded-full text-[12px] font-black transition-colors ${tab === key ? 'bg-[var(--red)] text-white' : 'text-ink-2'}`}>{label}</button>
                ))}
              </div>
              {tab === 'presensi' ? <TeamAttendance /> : <TeamCalendar />}
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
