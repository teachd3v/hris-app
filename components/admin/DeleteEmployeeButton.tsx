"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";
import { deleteEmployee } from "@/app/admin/employees/actions";

export default function DeleteEmployeeButton({ employeeId, employeeName, employeeEmail }: { employeeId: string; employeeName: string; employeeEmail: string }) {
  // 1 peringatan, 2 konfirmasi, 3 memproses, 4 selesai
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const close = () => {
    setStep(0); setEmail(""); setPassword(""); setError(null); setLoading(false);
  };

  const goToList = () => {
    // Navigasi penuh: halaman detail ini sudah tidak punya data, hindari render ulang RSC
    window.location.assign("/admin/employees");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStep(3);
    try {
      const res = await deleteEmployee(employeeId, email, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        setStep(2);
        return;
      }
    } catch {
      // Respons server gagal dibaca; hasil sebenarnya terlihat di daftar karyawan
      goToList();
      return;
    }
    setLoading(false);
    setStep(4);
    setTimeout(goToList, 1500);
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-line-2 bg-white text-sm text-ink outline-none focus:border-[var(--red)]";
  const emailMatches = email.trim().toLowerCase() === employeeEmail.trim().toLowerCase();

  return (
    <>
      <button type="button" onClick={() => setStep(1)} className="btn btn-ghost btn-sm text-red-600">Hapus Akun</button>
      {step > 0 && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-red-200 w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              {step < 3 ? <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600"><AlertTriangle size={24} /></div> : <div />}
              {step < 3 && <button type="button" onClick={close} className="p-2 text-ink-3 hover:text-ink rounded-full"><X size={18} /></button>}
            </div>
            {step === 3 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center" role="status" aria-live="polite">
                <Loader2 size={40} className="animate-spin text-[var(--red)]" />
                <h3 className="text-lg font-black text-ink">Menghapus akun...</h3>
                <p className="text-sm text-ink-2">Data dan file {employeeName} sedang dihapus. Mohon jangan tutup halaman ini.</p>
              </div>
            ) : step === 4 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center" role="status" aria-live="polite">
                <CheckCircle2 size={40} className="text-green-600" />
                <h3 className="text-lg font-black text-ink">Akun berhasil dihapus</h3>
                <p className="text-sm text-ink-2">Mengalihkan ke daftar karyawan...</p>
                <button type="button" onClick={goToList} className="btn btn-primary btn-sm mt-2">Kembali ke daftar</button>
              </div>
            ) : step === 1 ? (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-black text-ink">Hapus akun {employeeName}?</h3>
                <p className="text-sm text-ink-2">
                  Seluruh data karyawan ini akan dihapus <b>permanen</b>: profil, presensi, cuti, asesmen, dokumen, dan file yang diunggah. Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={close} className="btn btn-ghost btn-sm">Batal</button>
                  <button type="button" onClick={() => setStep(2)} className="btn btn-primary btn-sm">Lanjutkan</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <h3 className="text-lg font-black text-ink">Konfirmasi penghapusan</h3>
                <p className="text-sm text-ink-2">Ketik email <b>{employeeEmail}</b> dan masukkan password Anda untuk melanjutkan.</p>
                <input required autoComplete="off" placeholder="Email karyawan" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                <input required type="password" autoComplete="current-password" placeholder="Password Anda (admin)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={close} className="btn btn-ghost btn-sm">Batal</button>
                  <button type="submit" disabled={loading || !emailMatches || !password} className="btn btn-primary btn-sm disabled:opacity-50">Hapus Permanen</button>
                </div>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}
