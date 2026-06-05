"use client";

import confetti from "canvas-confetti";
import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Sparkles, PartyPopper } from "lucide-react";
import StarRating from "./StarRating";

export interface Item {
  id: string;
  text: string;
  dimension: string;
  type: "scale" | "textarea";
}

export interface Section {
  section_id: string;
  title: string;
  description: string;
  items: Item[];
}

export interface Instrument {
  form_id: string;
  title: string;
  instructions: string;
  scale_definition: {
    min: number;
    max: number;
    labels: Record<string, string>;
  };
  sections: Section[];
}

export default function AssessmentWizard({ instrument, onExit }: { instrument: Instrument, onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [isSummary, setIsSummary] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const allItems = useMemo(() => {
    return instrument.sections.flatMap(s => s.items);
  }, [instrument]);

  const currentItem = allItems[currentIndex];
  const progress = ((currentIndex + 1) / allItems.length) * 100;
  const isLast = currentIndex === allItems.length - 1;

  const currentSection = useMemo(() => {
    return instrument.sections.find(s => s.items.some(i => i.id === currentItem.id));
  }, [instrument, currentItem]);

  const handleNext = () => {
    if (isLast) {
      setIsSummary(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => prev - 1);
  };

  const handleAnswer = (value: number | string) => {
    setAnswers(prev => ({ ...prev, [currentItem.id]: value }));
    
    // Auto-next only for scale (stars)
    if (currentItem.type === "scale" && typeof value === "number") {
      setTimeout(() => {
        handleNext();
      }, 400);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    
    // Celebration!
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-[var(--green-soft)] rounded-[32px] flex items-center justify-center text-[var(--green)] mx-auto mb-8 shadow-xl shadow-[var(--green)]/10">
          <PartyPopper size={48} />
        </div>
        <h2 className="text-4xl font-black text-ink mb-4 tracking-tight">Luar Biasa!</h2>
        <p className="text-ink-2 text-lg font-medium leading-relaxed mb-10">
          Asesmen kamu berhasil terkirim. Terima kasih telah meluangkan waktu untuk memberikan refleksi diri.
        </p>
        <button 
          onClick={onExit}
          className="btn btn-primary h-14 px-10 text-base font-bold rounded-2xl shadow-lg shadow-[var(--red)]/20"
        >
          Selesai & Kembali
        </button>
      </div>
    );
  }

  if (isSummary) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[var(--green-soft)] rounded-full flex items-center justify-center text-[var(--green)] mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Ringkasan Jawaban</h2>
          <p className="text-ink-3 mt-1 text-xs">Pastikan semua jawaban sudah sesuai sebelum dikirim.</p>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar mb-8">
          {allItems.map((item, idx) => (
            <div key={item.id} className="p-4 rounded-xl bg-[var(--surface-item)] border border-[var(--line)] flex items-start gap-4 group hover:border-[var(--line-2)] transition-colors">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-focus)] flex items-center justify-center text-[11px] font-bold text-ink-4 group-hover:text-[var(--red)] transition-colors flex-none mt-1">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-ink-2 font-medium mb-1">{item.text}</div>
                {item.type === "textarea" ? (
                  <div className="text-[13px] text-ink font-semibold italic text-ink-3 bg-[var(--surface-focus)] p-3 rounded-lg border border-[var(--line)] mt-2">
                    {answers[item.id] || <span className="opacity-40">Tidak ada jawaban...</span>}
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center px-3 py-1 bg-[var(--yellow-soft)] rounded-lg font-bold text-[14px] text-[var(--yellow-ink)] shadow-sm">
                    {answers[item.id]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setIsSummary(false)} 
            className="btn btn-ghost flex-1 h-12 text-sm font-bold rounded-xl"
          >
            Ubah Jawaban
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn btn-primary flex-1 h-12 text-sm font-bold rounded-xl shadow-lg shadow-[var(--red)]/10 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Kirim Asesmen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Integrated Header Row: Back Button + Progress Bar + Focus Dot */}
      <div className="flex items-center gap-6 mb-8">
        <button
          onClick={onExit}
          className="w-10 h-10 rounded-full bg-[var(--surface-item)] border border-[var(--line)] flex items-center justify-center text-ink-3 hover:text-ink hover:border-[var(--line-2)] transition-all flex-none"
          title="Keluar"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black text-[var(--red)] uppercase tracking-[0.2em]">Progres</span>
            <span className="text-[9px] font-bold text-ink-4 tracking-widest">{currentIndex + 1} / {allItems.length} Soal</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--red)] to-[#FF6B6B] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center flex-none">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--green)] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in zoom-in-95 duration-300" key={currentIndex}>
        {currentSection && (
          <div className="p-4 bg-[var(--surface-item)] border border-[var(--line)] rounded-2xl text-center">
            <div className="text-[9px] font-bold text-[var(--red)] uppercase tracking-[0.3em] mb-1">
              {currentSection.title}
            </div>
            <p className="text-sm text-ink-3 font-medium max-w-2xl mx-auto">
              {currentSection.description}
            </p>
          </div>
        )}

        <div className="text-center">
          <div className="inline-block px-3 py-1 bg-[var(--surface-item)] border border-[var(--line)] rounded-full mb-3">
            <span className="text-[9px] font-bold text-ink-4 uppercase tracking-widest">
              Pertanyaan {currentIndex + 1}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-ink leading-snug max-w-4xl mx-auto tracking-tight">
            {currentItem.text}
          </h2>
        </div>

        <div className="py-2 flex justify-center w-full">
          {currentItem.type === "textarea" ? (
            <textarea
              className="w-full max-w-xl min-h-[100px] p-4 rounded-2xl bg-[var(--surface-item)] border-2 border-[var(--line)] text-ink focus:border-[var(--red-soft)] focus:outline-none transition-all resize-none text-base"
              placeholder="Tuliskan refleksi atau masukan Anda di sini..."
              value={(answers[currentItem.id] as string) || ""}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          ) : (
            <StarRating 
              value={(answers[currentItem.id] as number) || 0}
              max={instrument.scale_definition.max}
              onChange={handleAnswer}
              labels={instrument.scale_definition.labels}
            />
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-ink-3 hover:text-ink font-bold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          KEMBALI
        </button>

        <div className="hidden md:flex items-center gap-2 text-[var(--ink-4)] italic text-[10px]">
          <Info size={12} />
          <span>Klik bintang untuk lanjut otomatis</span>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 text-[var(--red)] hover:text-[var(--red-hover)] font-bold text-xs transition-all group"
        >
          LANJUT
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
