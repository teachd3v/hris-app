"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export function ArrayItemCard({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border border-line-2 rounded-xl p-4 relative">
      <button
        type="button"
        onClick={onRemove}
        title="Hapus"
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-ink-3 hover:bg-[rgba(220,38,38,0.1)] hover:text-[var(--red)] transition-colors"
      >
        <Trash2 size={14} strokeWidth={2.25} />
      </button>
      <div className="pr-8">{children}</div>
    </div>
  );
}

export function AddItemButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 border border-dashed border-line-2 rounded-xl py-3 text-sm font-semibold text-ink-3 hover:bg-line hover:text-ink hover:border-line transition-colors"
    >
      <Plus size={14} strokeWidth={2.25} />
      {label}
    </button>
  );
}
