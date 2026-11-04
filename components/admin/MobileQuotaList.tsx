"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { getQuotaEmployees, type QuotaEmployee } from "@/app/admin/leave-quotas/actions";

/** Daftar karyawan untuk mengatur kuota cuti (HP). Ketuk nama untuk membuka editor jatah. */
export default function MobileQuotaList() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [employees, setEmployees] = useState<QuotaEmployee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    setEmployees(null);
    setError(null);
    getQuotaEmployees(year)
      .then((rows) => { if (!cancelled) setEmployees(rows); })
      .catch(() => { if (!cancelled) setError("Gagal memuat daftar karyawan"); });
    return () => { cancelled = true; };
  }, [year]);

  const query = q.trim().toLowerCase();
  const shown = (employees ?? []).filter((e) => !query || `${e.name ?? ""} ${e.email ?? ""} ${e.dept ?? ""} ${e.title ?? ""}`.toLowerCase().includes(query));

  return (
    <>
      <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Tahun" className="w-full h-12 px-3.5 rounded-2xl border border-line-2 bg-white text-[14px] font-bold text-ink shadow-sm">
        {[thisYear - 1, thisYear, thisYear + 1].map((y) => <option key={y} value={y}>Tahun {y}</option>)}
      </select>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, departemen" aria-label="Cari karyawan" className="w-full h-12 pl-10 pr-3 rounded-2xl border border-line-2 bg-white text-[14px] text-ink outline-none focus:border-[var(--red)] shadow-sm" />
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!employees && !error ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
      ) : employees ? (
        <>
          <p className="text-[11px] text-ink-3 px-1">{shown.length} dari {employees.length} karyawan</p>
          <div className="flex flex-col gap-2">
            {shown.map((e) => (
              <Link key={e.id} href={`/admin/m/kuota/${e.id}?tahun=${year}`} className="bg-white rounded-[18px] border border-[var(--line)] p-3.5 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform">
                <div className="min-w-0">
                  <div className="text-[14px] font-extrabold text-ink truncate">{e.name || e.email}</div>
                  <div className="text-[11px] text-ink-3 truncate">{[e.title, e.dept].filter(Boolean).join(" • ") || e.email}</div>
                  {e.customCount > 0 && <div className="text-[10px] font-black text-[var(--red)] mt-1">{e.customCount} jatah khusus</div>}
                </div>
                <ChevronRight size={18} className="text-ink-3 shrink-0" />
              </Link>
            ))}
            {shown.length === 0 && <p className="text-sm text-ink-3 text-center py-8">Tidak ada karyawan yang cocok.</p>}
          </div>
        </>
      ) : null}
    </>
  );
}
