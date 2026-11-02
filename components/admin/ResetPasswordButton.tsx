"use client";

import { useState } from "react";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { resetEmployeePassword } from "@/app/admin/employees/actions";

export default function ResetPasswordButton({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const confirm = async () => {
    setLoading(true);
    const res = await resetEmployeePassword(employeeId);
    setLoading(false);
    setOpen(false);
    setMessage(res.error ?? "Password dikembalikan ke default. Minta karyawan login lalu menggantinya.");
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">Reset Password</button>
      {message && <p role="status" className="text-[11px] font-medium text-ink-3 max-w-[200px]">{message}</p>}
      <DeleteConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={loading}
        title="Reset Password"
        message={`Kembalikan password ${employeeName} ke password default? Sesi login aktifnya akan dikeluarkan.`}
        confirmLabel="Ya, Reset"
      />
    </>
  );
}
