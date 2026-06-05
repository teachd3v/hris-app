"use client";

import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Hapus Data",
  message = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Hapus",
  loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-red-200/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle size={24} />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-ink-3 hover:text-ink hover:bg-line-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-xl font-bold text-ink mb-2">{title}</h3>
          <p className="text-ink-2 leading-relaxed">{message}</p>
        </div>

        <div className="p-6 bg-line-2/50 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-5 py-2.5 rounded-full font-semibold border border-line-2 bg-white text-ink hover:bg-line-2 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-2.5 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menghapus...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
