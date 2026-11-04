"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getEmployeeBalances, saveEmployeeQuotas } from "@/app/admin/leave-quotas/actions";
import type { LeaveBalance } from "@/lib/leave-balance";

type Built = { payload: Record<string, number | null>; error?: string };

/** Perubahan yang akan dikirim (sama dengan versi desktop): angka = jatah khusus, kosong pada jatah khusus = kembali ke bawaan. */
function buildPayload(balances: LeaveBalance[], inputs: Record<string, string>): Built {
  const payload: Record<string, number | null> = {};
  for (const b of balances) {
    const raw = (inputs[b.type] ?? "").trim().replace(",", ".");
    if (raw === "") {
      if (b.explicit) payload[b.type] = null;
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return { payload: {}, error: `Jatah ${b.type} harus berupa angka` };
    if (!b.explicit || b.quota !== n) payload[b.type] = n;
  }
  return { payload };
}

/** Editor jatah cuti satu karyawan (HP): satu kartu per jenis, tombol Simpan menempel di dasar layar. */
export default function MobileQuotaEditor({ employeeId, year }: { employeeId: string; year: number }) {
  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const b = await getEmployeeBalances(employeeId, year);
      setBalances(b);
      // Input terisi hanya untuk jatah khusus; kosong = pakai bawaan
      setInputs(Object.fromEntries(b.map((x) => [x.type, x.explicit && x.quota !== null ? String(x.quota) : ""])));
    } catch {
      setLoadError("Gagal memuat jatah cuti");
    }
  }, [employeeId, year]);

  useEffect(() => { load(); }, [load]);

  const built = buildPayload(balances ?? [], inputs);
  const changedCount = Object.keys(built.payload).length;

  const save = async () => {
    if (built.error) return setMessage({ ok: false, text: built.error });
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveEmployeeQuotas(employeeId, year, built.payload);
      if (res.error) return setMessage({ ok: false, text: res.error });
      await load();
      setMessage({ ok: true, text: "Jatah cuti tersimpan" });
    } catch {
      setMessage({ ok: false, text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <p role="alert" className="text-sm text-red-600">{loadError}</p>;
  if (!balances) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {balances.map((b) => {
          const raw = (inputs[b.type] ?? "").trim();
          const dirty = b.type in built.payload;
          return (
            <div key={b.type} data-testid="quota-card" className={`bg-white rounded-[18px] border p-3.5 flex flex-col gap-2.5 ${dirty ? "border-[var(--red)]" : "border-[var(--line)]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold text-ink">{b.type}</div>
                  <div className="text-[11px] text-ink-3 leading-snug">
                    Jatah {b.quota === null ? "tak terbatas" : `${b.quota} hari`} ({b.explicit ? "khusus" : "bawaan"}) · Terpakai {b.used} · Menunggu {b.pending}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] font-black uppercase tracking-wider text-ink-3">Sisa</div>
                  <div className="text-[20px] leading-none font-black text-ink">{b.remaining === null ? "∞" : b.remaining}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  aria-label={`Jatah khusus ${b.type}`}
                  value={inputs[b.type] ?? ""}
                  placeholder={b.explicit ? "" : b.quota === null ? "Tak terbatas" : `${b.quota} (bawaan)`}
                  onChange={(e) => setInputs((p) => ({ ...p, [b.type]: e.target.value }))}
                  className="flex-1 h-11 px-3.5 rounded-2xl border border-line-2 bg-white text-[14px] text-ink outline-none focus:border-[var(--red)]"
                />
                {(b.explicit || raw !== "") && (
                  <button type="button" onClick={() => setInputs((p) => ({ ...p, [b.type]: "" }))} className="h-11 px-3 rounded-2xl text-[11px] font-bold text-ink-2 bg-gray-100 border border-black/10 shrink-0">
                    Bawaan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ruang agar kartu terakhir tidak tertutup bilah simpan */}
      <div className="h-28" />
      <div className="fixed bottom-0 inset-x-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="bg-white rounded-[20px] border border-black/10 shadow-[0_-6px_24px_rgba(0,0,0,0.10)] p-2.5 flex flex-col gap-2">
          {message && <p role="status" className={`px-1.5 text-[12px] font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
          {built.error && <p role="alert" className="px-1.5 text-[12px] font-medium text-red-600">{built.error}</p>}
          <button type="button" onClick={save} disabled={saving || changedCount === 0 || Boolean(built.error)} className="w-full h-12 rounded-full bg-[var(--red)] text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : changedCount > 0 ? `Simpan (${changedCount} perubahan)` : "Tidak ada perubahan"}
          </button>
        </div>
      </div>
    </>
  );
}
