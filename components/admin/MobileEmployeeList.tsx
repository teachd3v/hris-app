"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

export interface MobileEmployee {
  id: string;
  name: string | null;
  title: string | null;
  dept: string | null;
  email: string | null;
  role: string | null;
  /** Super Admin / Admin / Karyawan (dihitung di server). */
  accessLabel: "Super Admin" | "Admin" | "Karyawan";
  approval_status: string | null;
}

export default function MobileEmployeeList({ employees }: { employees: MobileEmployee[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const shown = employees.filter((e) => !query || `${e.name ?? ""} ${e.email ?? ""} ${e.dept ?? ""} ${e.title ?? ""}`.toLowerCase().includes(query));

  return (
    <>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, departemen" aria-label="Cari karyawan" className="w-full h-12 pl-10 pr-3 rounded-2xl border border-line-2 bg-white text-[14px] text-ink outline-none focus:border-[var(--red)] shadow-sm" />
      </div>
      <p className="text-[11px] text-ink-3 px-1">{shown.length} dari {employees.length} karyawan</p>
      <div className="flex flex-col gap-2">
        {shown.map((e) => (
          <Link key={e.id} href={`/admin/m/karyawan/${e.id}`} className="bg-white rounded-[18px] border border-[var(--line)] p-3.5 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform">
            <div className="min-w-0">
              <div className="text-[14px] font-extrabold text-ink truncate">{e.name || e.email}</div>
              <div className="text-[11px] text-ink-3 truncate">{[e.title, e.dept].filter(Boolean).join(" • ") || e.email}</div>
              <div className="flex gap-1.5 mt-1">
                {e.accessLabel === "Super Admin" && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-100">Super Admin</span>}
                {e.accessLabel === "Admin" && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-100">Admin</span>}
                {e.approval_status && e.approval_status !== "Approved" && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100">{e.approval_status}</span>}
              </div>
            </div>
            <ChevronRight size={18} className="text-ink-3 shrink-0" />
          </Link>
        ))}
        {shown.length === 0 && <p className="text-sm text-ink-3 text-center py-8">Tidak ada karyawan yang cocok.</p>}
      </div>
    </>
  );
}
