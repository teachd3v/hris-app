"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getTeamCalendar, type TeamCalendarLeave } from "@/app/employee/tim/actions";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const fmtShort = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

export default function TeamCalendar() {
  const now = new Date(Date.now() + 7 * 3600_000);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [leaves, setLeaves] = useState<TeamCalendarLeave[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string; type: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(now.toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Muat data bulan terpilih; `cancelled` mencegah respons lama menimpa bulan yang baru dipilih
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTeamCalendar(year, month);
        if (cancelled) return;
        if (res.error) return setError(res.error);
        setLeaves(res.leaves);
        setHolidays(res.holidays);
      } catch {
        if (!cancelled) setError("Gagal memuat kalender tim");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year, month]);

  const move = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth() + 1);
    setSelected(null);
  };

  const holidayBy = useMemo(() => new Map(holidays.map((h) => [h.date, h])), [holidays]);
  const leavesOn = useCallback((date: string) => leaves.filter((l) => l.start <= date && l.end >= date), [leaves]);

  // Sel kalender (Senin = kolom pertama)
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedLeaves = selected ? leavesOn(selected) : [];
  const selectedHoliday = selected ? holidayBy.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="bg-white rounded-[20px] border border-[var(--line)] p-3 md:p-4 flex items-center justify-between">
        <button type="button" aria-label="Bulan sebelumnya" onClick={() => move(-1)} className="w-9 h-9 rounded-xl border border-line-2 flex items-center justify-center"><ChevronLeft size={18} /></button>
        <div className="text-[14px] font-black text-ink">{MONTHS[month - 1]} {year}</div>
        <button type="button" aria-label="Bulan berikutnya" onClick={() => move(1)} className="w-9 h-9 rounded-xl border border-line-2 flex items-center justify-center"><ChevronRight size={18} /></button>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
      ) : (
        <>
          <div className="bg-white rounded-[20px] border border-[var(--line)] p-2 md:p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d, i) => <div key={d} className={`text-center text-[10px] font-black uppercase tracking-wider py-1 ${i >= 5 ? "text-[var(--red)]" : "text-ink-3"}`}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const date = iso(year, month, day);
                const dow = idx % 7;
                const hol = holidayBy.get(date);
                const on = leavesOn(date);
                const off = dow >= 5 || Boolean(hol);
                const shown = off ? [] : on;
                const isSel = selected === date;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelected(date)}
                    aria-label={`${day} ${MONTHS[month - 1]}${hol ? `, libur ${hol.name}` : ""}${shown.length ? `, ${shown.length} orang cuti` : ""}`}
                    className={`min-h-[54px] md:min-h-[84px] rounded-xl border p-1 text-left flex flex-col gap-0.5 transition-colors ${isSel ? "border-[var(--red)] bg-red-50/60" : "border-line-2 bg-white hover:border-ink/30"} ${off ? "bg-gray-50/70" : ""}`}
                  >
                    <span className={`text-[11px] md:text-[12px] font-black ${off ? "text-[var(--red)]" : "text-ink"}`}>{day}</span>
                    {hol && <span className="hidden md:block text-[9px] font-bold text-[var(--red)] leading-tight line-clamp-2">{hol.name}</span>}
                    {shown.length > 0 && (
                      <>
                        <span className="md:hidden self-start text-[9px] font-black text-white bg-indigo-500 rounded-full px-1.5">{shown.length}</span>
                        <div className="hidden md:flex flex-col gap-0.5">
                          {shown.slice(0, 2).map((l) => (
                            <span key={l.id} className={`truncate text-[9px] font-bold rounded px-1 ${l.pending ? "border border-dashed border-orange-300 text-orange-700 bg-orange-50" : "bg-indigo-100 text-indigo-800"}`}>{l.name.split(" ")[0]}</span>
                          ))}
                          {shown.length > 2 && <span className="text-[9px] font-bold text-ink-3">+{shown.length - 2} lagi</span>}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-bold text-ink-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200" /> Disetujui</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-dashed border-orange-300 bg-orange-50" /> Menunggu persetujuan</span>
              <span className="flex items-center gap-1"><span className="text-[var(--red)]">●</span> Libur / akhir pekan</span>
            </div>
          </div>

          {selected && (
            <div className="bg-white rounded-[20px] border border-[var(--line)] p-4" data-testid="day-detail">
              <h3 className="text-[13px] font-black text-ink mb-2">{new Date(selected + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</h3>
              {selectedHoliday && <p className="text-[12px] font-bold text-[var(--red)] mb-2">Libur: {selectedHoliday.name}</p>}
              {selectedLeaves.length === 0 ? (
                <p className="text-[12px] text-ink-3">Tidak ada anggota tim yang cuti.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {selectedLeaves.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="font-bold text-ink truncate">{l.name}</span>
                      <span className="text-ink-3 shrink-0">{l.leave_type} · {fmtShort(l.start)}–{fmtShort(l.end)}{l.pending ? " · menunggu" : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-white rounded-[20px] border border-[var(--line)] p-4">
            <h3 className="text-[13px] font-black text-ink mb-2">Cuti bulan ini ({leaves.length})</h3>
            {leaves.length === 0 ? (
              <p className="text-[12px] text-ink-3">Tidak ada cuti tim pada bulan ini.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {leaves.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-[12px] border-t border-line-2 pt-2 first:border-0 first:pt-0">
                    <div className="min-w-0"><div className="font-bold text-ink truncate">{l.name}</div><div className="text-ink-3">{l.leave_type}</div></div>
                    <div className="text-right shrink-0"><div className="font-semibold text-ink-2">{fmtShort(l.start)}{l.end !== l.start ? ` – ${fmtShort(l.end)}` : ""}</div><div className={l.pending ? "text-orange-600 font-bold" : "text-green-600 font-bold"}>{l.pending ? "Menunggu" : "Disetujui"} · {l.days} hari</div></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
