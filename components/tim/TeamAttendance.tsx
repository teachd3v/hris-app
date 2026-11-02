"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getTeamAttendance, type TeamAttendanceRow, type TeamAttendanceStatus } from "@/app/employee/tim/actions";

const STATUS: Record<TeamAttendanceStatus, { label: string; cls: string }> = {
  HADIR: { label: "Hadir", cls: "bg-green-50 text-green-700 border-green-100" },
  BELUM_PULANG: { label: "Belum pulang", cls: "bg-blue-50 text-blue-700 border-blue-100" },
  TIDAK_CLOCK_OUT: { label: "Tidak clock-out", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  CUTI: { label: "Cuti", cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  LIBUR: { label: "Libur", cls: "bg-gray-50 text-gray-500 border-gray-100" },
  BELUM_HADIR: { label: "Belum hadir", cls: "bg-orange-50 text-orange-700 border-orange-100" },
  TIDAK_HADIR: { label: "Tidak hadir", cls: "bg-red-50 text-red-700 border-red-100" },
  BELUM_WAKTUNYA: { label: "—", cls: "bg-gray-50 text-gray-400 border-gray-100" },
};

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const shift = (date: string, days: number) => {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const fmtDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":") : "--:--");

export default function TeamAttendance() {
  const [date, setDate] = useState(todayWib());
  const [rows, setRows] = useState<TeamAttendanceRow[]>([]);
  const [holiday, setHoliday] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTeamAttendance(d);
      if (res.error) return setError(res.error);
      setRows(res.rows);
      setHoliday(res.holiday);
    } catch {
      setError("Gagal memuat presensi tim");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const count = (s: TeamAttendanceStatus[]) => rows.filter((r) => s.includes(r.status)).length;
  const isToday = date === todayWib();

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="bg-white rounded-[20px] border border-[var(--line)] p-3 md:p-4 flex items-center justify-between gap-2">
        <button type="button" aria-label="Hari sebelumnya" onClick={() => setDate(shift(date, -1))} className="w-9 h-9 rounded-xl border border-line-2 flex items-center justify-center"><ChevronLeft size={18} /></button>
        <div className="text-center min-w-0">
          <div className="text-[13px] md:text-[14px] font-black text-ink truncate">{fmtDate(date)}</div>
          {holiday && <div className="text-[11px] font-bold text-[var(--red)]">Libur: {holiday}</div>}
          <input type="date" value={date} max={todayWib()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pilih tanggal" className="mt-1 h-8 px-2 rounded-lg border border-line-2 text-[12px] text-ink-2 bg-white" />
          {!isToday && <button type="button" onClick={() => setDate(todayWib())} className="ml-2 text-[11px] font-bold text-[var(--red)] underline">Hari ini</button>}
        </div>
        <button type="button" aria-label="Hari berikutnya" onClick={() => setDate(shift(date, 1))} disabled={date >= todayWib()} className="w-9 h-9 rounded-xl border border-line-2 flex items-center justify-center disabled:opacity-40"><ChevronRight size={18} /></button>
      </div>

      {!loading && !error && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            ["Hadir", count(["HADIR", "BELUM_PULANG", "TIDAK_CLOCK_OUT"]), "text-green-700"],
            ["Cuti", count(["CUTI"]), "text-indigo-700"],
            ["Belum / tidak hadir", count(["BELUM_HADIR", "TIDAK_HADIR"]), "text-red-700"],
          ].map(([label, n, cls]) => (
            <div key={label as string} className="bg-white rounded-[16px] border border-[var(--line)] p-2.5 md:p-3 text-center">
              <div className={`text-xl font-black ${cls}`}>{n as number}</div>
              <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider leading-tight">{label as string}</div>
            </div>
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
      ) : rows.length === 0 && !error ? (
        <p className="text-sm text-ink-3 text-center py-8">Belum ada bawahan.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const st = STATUS[r.status];
            return (
              <div key={r.id} className="bg-white rounded-[18px] border border-[var(--line)] p-3 md:p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold text-ink truncate">{r.name}</div>
                  <div className="text-[11px] text-ink-3 truncate">
                    {[r.title, r.dept].filter(Boolean).join(" • ") || "—"}
                    {r.level > 1 && r.managerName ? ` • atasan: ${r.managerName}` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${st.cls}`}>{st.label}{r.detail ? ` · ${r.detail}` : ""}</span>
                  {(r.clock_in || r.clock_out) && (
                    <span className="text-[11px] font-bold text-ink-2">
                      {fmtTime(r.clock_in)} – {fmtTime(r.clock_out)}
                      {r.duration_hours != null && ` (${r.duration_hours.toFixed(1)} j)`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-ink-4 px-1">Hanya jam masuk, jam pulang, dan status. Foto dan lokasi presensi hanya dapat dilihat admin.</p>
    </div>
  );
}
