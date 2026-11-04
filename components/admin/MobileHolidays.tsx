"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteHoliday, listHolidays, saveHolidays, type HolidayRow } from "@/app/admin/holidays/actions";
import { HOLIDAY_TYPES, expandDateRange } from "@/lib/leave";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";

const typeLabel = (t: string) => HOLIDAY_TYPES.find((x) => x.key === t)?.label ?? t;
const dayNum = (d: string) => new Date(d + "T00:00:00Z").getUTCDate();
const weekday = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" });
const fullDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthLabel = (ym: string) => new Date(ym + "-01T00:00:00Z").toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

const inputCls = "w-full h-12 px-3.5 rounded-2xl border border-line-2 bg-white text-[14px] text-ink outline-none focus:border-[var(--red)]";
const labelCls = "text-[11px] font-bold text-ink-3 uppercase tracking-wider";

type Form = { editing: boolean; start: string; end: string; name: string; type: string };
const emptyForm: Form = { editing: false, start: "", end: "", name: "", type: "NATIONAL" };

/** Hari libur versi HP: daftar per bulan, tambah (bisa rentang), ubah, hapus. Impor massal hanya di desktop. */
export default function MobileHolidays() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [rows, setRows] = useState<HolidayRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<HolidayRow | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listHolidays(year));
      setLoadError(null);
    } catch {
      setLoadError("Gagal memuat hari libur");
    }
  }, [year]);

  useEffect(() => { setRows(null); load(); }, [load]);

  const existing = new Set((rows ?? []).map((r) => r.date));
  const range = form && !form.editing && form.start ? expandDateRange(form.start, form.end) : null;
  const overwriteCount = range ? range.filter((d) => existing.has(d)).length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const dates = expandDateRange(form.start, form.end);
    if (!dates) return setFormError("Rentang tanggal tidak valid (maksimal 60 hari)");
    setBusy(true);
    setFormError(null);
    try {
      const res = await saveHolidays(dates.map((date) => ({ date, name: form.name.trim(), type: form.type })));
      if (res.error) return setFormError(res.error);
      setMessage({ ok: true, text: `${res.saved} tanggal tersimpan` });
      setForm(null);
      await load();
    } catch {
      setFormError("Terjadi kesalahan, coba lagi");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const res = await deleteHoliday(toDelete.date);
      setMessage(res.error ? { ok: false, text: res.error } : { ok: true, text: "Hari libur dihapus" });
      setToDelete(null);
      await load();
    } catch {
      setMessage({ ok: false, text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setBusy(false);
    }
  };

  // Kelompokkan per bulan (rows sudah urut tanggal)
  const groups = new Map<string, HolidayRow[]>();
  for (const r of rows ?? []) groups.set(r.date.slice(0, 7), [...(groups.get(r.date.slice(0, 7)) ?? []), r]);

  return (
    <>
      <div className="flex gap-2">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Tahun" className="flex-1 h-12 px-3.5 rounded-2xl border border-line-2 bg-white text-[14px] font-bold text-ink shadow-sm">
          {[thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map((y) => <option key={y} value={y}>Tahun {y}</option>)}
        </select>
        <button type="button" onClick={() => { setForm({ ...emptyForm }); setFormError(null); }} className="h-12 px-4 rounded-2xl bg-[var(--red)] text-white text-[14px] font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
          <Plus size={16} strokeWidth={2.5} /> Tambah
        </button>
      </div>

      <p className="text-[11px] text-ink-3 px-1 leading-relaxed">Libur nasional dan cuti bersama tidak dihitung hari kerja pada pengajuan cuti baru. Cuti bersama saat ini tidak memotong cuti tahunan, menunggu ketentuan resmi lembaga.</p>

      {message && <p role="status" className={`px-1 text-[12px] font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
      {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}

      {!rows && !loadError ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
      ) : rows && rows.length === 0 ? (
        <p className="text-sm text-ink-3 text-center py-8">Belum ada hari libur untuk tahun {year}. Tambahkan sesuai SKB resmi pemerintah.</p>
      ) : (
        [...groups.entries()].map(([ym, items]) => (
          <section key={ym} className="flex flex-col gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-ink-3 px-1">{monthLabel(ym)}</h2>
            {items.map((h) => (
              <div key={h.date} data-testid="holiday-row" className="bg-white rounded-[18px] border border-[var(--line)] p-3 flex items-center gap-3">
                <div className="w-12 shrink-0 text-center">
                  <div className="text-[20px] leading-none font-black text-ink">{dayNum(h.date)}</div>
                  <div className="text-[10px] font-bold uppercase text-ink-3 mt-0.5">{weekday(h.date)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-extrabold text-ink break-words">{h.name}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${h.type === "JOINT" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-red-50 text-red-600 border-red-100"}`}>{typeLabel(h.type)}</span>
                </div>
                <button type="button" aria-label={`Ubah ${h.name}`} onClick={() => { setForm({ editing: true, start: h.date, end: "", name: h.name, type: h.type }); setFormError(null); }} className="w-9 h-9 flex items-center justify-center rounded-full text-ink-2 bg-gray-100 border border-black/10 shrink-0"><Pencil size={15} /></button>
                <button type="button" aria-label={`Hapus ${h.name}`} onClick={() => setToDelete(h)} className="w-9 h-9 flex items-center justify-center rounded-full text-red-600 bg-red-50 border border-red-100 shrink-0"><Trash2 size={15} /></button>
              </div>
            ))}
          </section>
        ))
      )}

      {/* Lembar isian (tambah / ubah) */}
      {form && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/40" onClick={() => !busy && setForm(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full bg-white rounded-t-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-black text-ink">{form.editing ? "Ubah Hari Libur" : "Tambah Hari Libur"}</h2>
              <button type="button" aria-label="Tutup" onClick={() => setForm(null)} disabled={busy} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100"><X size={18} /></button>
            </div>
            {form.editing ? (
              <p className="text-[13px] font-bold text-ink">{fullDate(form.start)}</p>
            ) : (
              <>
                <label className="flex flex-col gap-1.5"><span className={labelCls}>Tanggal</span>
                  <input type="date" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5"><span className={labelCls}>Sampai (opsional, untuk rentang)</span>
                  <input type="date" value={form.end} min={form.start} onChange={(e) => setForm({ ...form, end: e.target.value })} className={inputCls} />
                </label>
              </>
            )}
            <label className="flex flex-col gap-1.5"><span className={labelCls}>Nama</span>
              <input required maxLength={100} placeholder="mis. Hari Kemerdekaan RI" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5"><span className={labelCls}>Jenis</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                {HOLIDAY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
            {range && <p className="text-[11px] text-ink-3">{range.length} tanggal akan disimpan{overwriteCount > 0 ? `; ${overwriteCount} sudah ada dan akan diperbarui` : ""}.</p>}
            {formError && <p role="alert" className="text-[12px] font-medium text-red-600">{formError}</p>}
            <button type="submit" disabled={busy} className="h-12 rounded-full bg-[var(--red)] text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
            </button>
          </form>
        </div>
      )}

      <DeleteConfirmModal
        open={toDelete !== null}
        onClose={() => !busy && setToDelete(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Hapus Hari Libur"
        message={toDelete ? `Hapus ${toDelete.name} (${fullDate(toDelete.date)})? Berlaku untuk pengajuan cuti baru.` : ""}
      />
    </>
  );
}
