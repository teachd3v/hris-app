"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { approveByHC, overrideByHC, listAdminRequests, type LeaveRequest } from "@/app/employee/cuti/actions";
import ApprovalList from "@/components/cuti/ApprovalList";

export default function MobileHcApprovals() {
  const [tab, setTab] = useState<"hc" | "stalled">("hc");
  const [pending, setPending] = useState<LeaveRequest[] | null>(null);
  const [stalled, setStalled] = useState<LeaveRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [hc, held] = await Promise.all([
        listAdminRequests({ pendingOnly: true }),
        listAdminRequests({ status: "PENDING_DIRECT_MANAGER" }),
      ]);
      setPending(hc);
      setStalled(held);
    } catch {
      setError("Gagal memuat pengajuan");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!pending || !stalled) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {([["hc", `Menunggu HC (${pending.length})`], ["stalled", `Tertahan di Atasan (${stalled.length})`]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`px-3 py-2 rounded-full text-[11px] font-bold border ${tab === key ? "bg-ink text-white border-ink" : "bg-white text-ink-2 border-line-2"}`}>{label}</button>
        ))}
      </div>
      <div className="bg-white rounded-[20px] border border-[var(--line)] p-3 md:p-5">
        {tab === "hc" ? (
          <ApprovalList
            requests={pending}
            emptyText="Tidak ada pengajuan yang menunggu persetujuan HC."
            onDecide={async (id, approve, notes) => {
              const res = await approveByHC(id, approve, notes);
              if (!res.error) await load();
              return res;
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-ink-3 leading-relaxed">Belum diproses atasan langsung. HC dapat mengambil alih (final). Alasan wajib dan tercatat di log audit.</p>
            <ApprovalList
              requests={stalled}
              takeover
              requireNotes
              notesPlaceholder="Alasan ambil alih (wajib)"
              approveText="Ambil Alih: Setujui"
              rejectText="Ambil Alih: Tolak"
              emptyText="Tidak ada pengajuan yang tertahan di atasan."
              onDecide={async (id, approve, notes) => {
                const res = await overrideByHC(id, approve, notes);
                if (!res.error) await load();
                return res;
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
