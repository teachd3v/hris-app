"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  labels?: Record<string, string>;
}

export default function StarRating({ value, max = 7, onChange, labels }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-4 w-full py-2">
      <div className="flex items-center justify-center gap-1 sm:gap-2 w-full max-w-md">
        {stars.map((star) => {
          const isActive = star <= value;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="group relative transition-transform active:scale-90"
            >
              <Star
                size={42}
                strokeWidth={1.5}
                className={`transition-all duration-300 ${
                  isActive
                    ? "fill-[var(--yellow)] text-[var(--yellow)] drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                    : "text-[var(--line-2)] hover:text-[var(--ink-4)]"
                }`}
              />
              <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-opacity duration-300 ${
                value === star ? "opacity-100 text-[var(--yellow)]" : "opacity-0"
              }`}>
                {star}
              </span>
            </button>
          );
        })}
      </div>

      {/* Label Keterangan */}
      {labels && (
        <div className="flex justify-between w-full max-w-2xl px-4">
          <div className="text-center w-32">
            <div className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.2em] mb-2 opacity-60">Skala 1</div>
            <div className="text-[13px] font-bold text-ink-3 leading-tight">{labels["1"]}</div>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-4">
            {value > 0 && (
              <div className="bg-[var(--yellow-soft)] px-6 py-2.5 rounded-2xl border border-[var(--yellow)]/20 animate-in fade-in zoom-in duration-300 shadow-sm">
                <span className="text-[15px] font-black text-[var(--yellow-ink)] tracking-tight">
                  {value}. {labels[value.toString()]}
                </span>
              </div>
            )}
          </div>

          <div className="text-center w-32">
            <div className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.2em] mb-2 opacity-60">Skala 7</div>
            <div className="text-[13px] font-bold text-ink-3 leading-tight">{labels["7"]}</div>
          </div>
        </div>
      )}
    </div>
  );
}
