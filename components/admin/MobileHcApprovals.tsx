"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { approveByHC, listAdminRequests, type LeaveRequest } from "@/app/employee/cuti/actions";
import ApprovalList from "@/components/cuti/ApprovalList";

export default function MobileHcApprovals() {
  const [requests, setRequests] = useState<LeaveRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await listAdminRequests({ pendingOnly: true }));
    } catch {
      setError("Gagal memuat pengajuan");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <p role="alert" className="text-sm text-red-600">{error}</p>;
  if (!requests) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>;

  return (
    <div className="bg-white rounded-[20px] border border-[var(--line)] p-3 md:p-5">
      <ApprovalList
        requests={requests}
        emptyText="Tidak ada pengajuan yang menunggu persetujuan HC."
        onDecide={async (id, approve, notes) => {
          const res = await approveByHC(id, approve, notes);
          if (!res.error) await load();
          return res;
        }}
      />
    </div>
  );
}
