"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface EditSectionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  formId: string;
  saveLabel?: string;
  children: ReactNode;
}

export default function EditSectionModal({
  open,
  onClose,
  title,
  subtitle,
  formId,
  saveLabel = "Simpan",
  children,
}: EditSectionModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-line">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink m-0">{title}</h2>
            {subtitle && <p className="text-sm text-ink-3 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Tutup"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ink-3 hover:bg-line hover:text-ink transition-colors"
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
        <div className="flex justify-end gap-2 p-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            Batal
          </button>
          <button type="submit" form={formId} className="btn btn-primary btn-sm">
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
