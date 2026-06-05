"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAssessmentDetails, submitAssessment } from "../actions";
import { Loader2, ArrowRight, CheckCircle2, ChevronLeft, Sparkles, Star, AlertTriangle, Eye, Calendar, Info, Target, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function AssessmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [step, setStep] = useState<"opening" | "instructions" | "form" | "confirm" | "view" | "success">("opening");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const autoAdvanceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAssessmentDetails(params.id);
        setAssessment(data);
        if (data.status === "Selesai") {
           setAnswers((data.answers as Record<string, unknown>) || {});
           setStep("view");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    };
  }, [params.id]);

  if (loading) {
     return (
       <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-[var(--bg)]">
         <Loader2 className="animate-spin text-ink-3" size={40} />
         <p className="text-ink-3 font-semibold text-sm animate-pulse">Menyiapkan instrumen asesmen...</p>
       </div>
     );
  }

  if (!assessment) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
         <div className="glass p-10 text-center">
           <p className="text-ink font-bold">Asesmen tidak ditemukan.</p>
           <Link href="/employee/assessments" className="text-[var(--red)] text-sm font-semibold mt-4 inline-block hover:underline">Kembali</Link>
         </div>
       </div>
     );
  }

  const template = assessment.assessment_templates;
  const questions = template.schema;
  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleStart = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep("instructions");
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleStarClick = (questionId: string, val: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
    
    if (!isLastQuestion) {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 500);
    }
  };

  const goToConfirm = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep("confirm");
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await submitAssessment(params.id, answers);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep("success");
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#FACC15', '#22C55E', '#3B82F6']
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if current question is answered
  const isCurrentAnswered = () => {
    if (!currentQ) return false;
    if (currentQ.type === 'scale') return answers[currentQ.id] !== undefined;
    if (currentQ.type === 'textarea') return answers[currentQ.id] && answers[currentQ.id].trim() !== '';
    return true;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] py-6 md:py-8 px-4 md:px-8 flex justify-center items-start">
      <div className="w-full">
         <Link href="/employee/assessments" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink font-semibold text-sm mb-6 transition-colors bg-white/40 px-4 py-2 rounded-full border border-line">
            <ChevronLeft size={16} /> Kembali ke Pusat Penilaian
         </Link>

         {step === "opening" && (
            <div className="glass-strong p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-ink/5 w-full">
               <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 border-b border-line-2 pb-5">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#FACC15] flex items-center justify-center text-white shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)] flex-none">
                   <Sparkles size={24} />
                 </div>
                 <div>
                   <span className="text-[10px] font-black tracking-[0.2em] text-[var(--red)] uppercase mb-1 block">{template.category}</span>
                   <h1 className="text-2xl font-black text-ink leading-tight tracking-tight">{template.title}</h1>
                 </div>
               </div>
               
               <div className="text-sm md:text-[14px] text-ink-2 leading-[1.7] space-y-3 mb-8">
                 {template.opening_text.split('\n').map((paragraph: string, idx: number) => (
                    paragraph.trim() === '' ? <div key={idx} className="h-1" /> : <p key={idx}>{paragraph}</p>
                 ))}
               </div>

               <div className="flex justify-end pt-5 border-t border-line-2">
                 <button onClick={handleStart} className="w-full md:w-auto btn-primary h-12 px-8 text-sm rounded-xl group flex items-center justify-center gap-2">
                   Lihat Tata Cara Mengisi
                   <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
         )}

         {step === "instructions" && (
            <div className="glass-strong p-8 md:p-12 animate-in fade-in slide-in-from-right-8 duration-500 shadow-2xl w-full">
               <div className="text-center mb-10">
                 <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10">
                   <Info size={32} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-3xl font-black text-ink tracking-tight mb-2">Tata Cara Mengisi Asesmen</h2>
                 <p className="text-ink-3 font-medium">Mohon perhatikan poin-poin berikut sebelum memulai.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                 <div className="p-6 rounded-3xl bg-white/40 border border-line-2 hover:border-blue-200 transition-colors">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                     <Target size={20} strokeWidth={2.5} />
                   </div>
                   <h4 className="font-bold text-ink mb-2">Objektivitas</h4>
                   <p className="text-xs text-ink-3 leading-relaxed">Berikan jawaban yang jujur dan paling menggambarkan kondisi Anda saat ini di lingkungan kerja.</p>
                 </div>

                  <div className="p-6 rounded-3xl bg-white/40 border border-line-2 hover:border-yellow-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-4">
                      <Star size={20} strokeWidth={2.5} />
                    </div>
                    <h4 className="font-bold text-ink mb-2">Skala Bintang (1-7)</h4>
                    <p className="text-xs text-ink-3 leading-relaxed mb-3">Pilih jumlah bintang (1-7) untuk merepresentasikan tingkat kesetujuan Anda:</p>
                    <div className="space-y-1">
                      {[
                        { v: 1, l: "Sangat Tidak Sesuai" },
                        { v: 2, l: "Tidak Sesuai" },
                        { v: 3, l: "Kurang Sesuai" },
                        { v: 4, l: "Cukup Sesuai" },
                        { v: 5, l: "Sesuai" },
                        { v: 6, l: "Sangat Sesuai" },
                        { v: 7, l: "Sepenuhnya Sesuai" },
                      ].map((item) => (
                        <div key={item.v} className="flex items-center gap-2 text-[10px] text-ink-2 font-semibold">
                          <span className="w-4 h-4 rounded-md bg-yellow-100 text-yellow-700 flex items-center justify-center text-[9px]">{item.v}</span>
                          {item.l}
                        </div>
                      ))}
                    </div>
                  </div>

                 <div className="p-6 rounded-3xl bg-white/40 border border-line-2 hover:border-green-200 transition-colors">
                   <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                     <ClipboardCheck size={20} strokeWidth={2.5} />
                   </div>
                   <h4 className="font-bold text-ink mb-2">Refleksi</h4>
                   <p className="text-xs text-ink-3 leading-relaxed">Pada bagian teks, ceritakan pengalaman atau alasan Anda secara singkat dan jelas.</p>
                 </div>
               </div>

               <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                 <button onClick={() => setStep("opening")} className="w-full md:w-auto btn-ghost h-12 px-8 text-sm rounded-xl font-bold">
                    Kembali
                 </button>
                 <button onClick={() => setStep("form")} className="w-full md:w-auto btn-primary h-14 px-10 text-sm rounded-xl group flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.4)]">
                   Saya Mengerti, Mulai Sekarang
                   <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
            </div>
         )}

         {step === "form" && currentQ && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full">
               {/* Progress Bar */}
               <div className="mb-6 text-center">
                 <div className="flex justify-center gap-1.5 mb-4">
                   {questions.map((_: any, idx: number) => (
                     <div 
                       key={idx} 
                       className={`h-1.5 rounded-full transition-all duration-500 ${
                         idx === currentQuestionIndex 
                           ? 'w-10 bg-[var(--red)]' 
                           : idx < currentQuestionIndex 
                             ? 'w-4 bg-red-300' 
                             : 'w-4 bg-line-2'
                       }`}
                     />
                   ))}
                 </div>
                 <h1 className="text-xl font-black text-ink tracking-tight mb-1">{template.title}</h1>
                 <p className="text-ink-3 text-xs font-medium">Pertanyaan {currentQuestionIndex + 1} dari {questions.length}</p>
               </div>

               {/* Wizard Card */}
               <div className="glass p-6 md:px-10 md:py-8 border-white/60 min-h-[250px] flex flex-col relative">
                  {currentQ.section && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-gradient-to-r from-[var(--red)] to-red-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_4px_10px_-4px_rgba(220,38,38,0.6)] whitespace-nowrap">
                        {currentQ.section}
                      </span>
                    </div>
                  )}

                  <div className={`text-center ${currentQ.section ? 'mt-3' : ''}`}>
                    {currentQ.description && (
                      <p className="text-lg md:text-xl text-ink-2 mb-6 font-semibold italic text-balance mx-auto max-w-4xl leading-relaxed">
                        "{currentQ.description}"
                      </p>
                    )}
                    <h3 className="text-xl md:text-2xl font-black text-ink leading-snug mb-8 text-balance mx-auto max-w-4xl">
                      {currentQ.question}
                    </h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    {currentQ.type === 'scale' && (
                       <div className="flex flex-col items-center gap-8 w-full">
                          <div className="flex items-center justify-center gap-3 md:gap-6 w-full max-w-4xl">
                             <span className="hidden md:block text-[10px] font-black text-ink-4 uppercase tracking-[0.2em] text-right w-32 leading-snug">
                                {currentQ.minLabel}
                             </span>
                             
                             <div className="flex justify-center gap-1.5 md:gap-3">
                                {Array.from({ length: currentQ.maxScore }).map((_, i) => {
                                   const val = i + 1;
                                   const isSelected = answers[currentQ.id] >= val;
                                   const labels = [
                                      "Sangat Tidak Sesuai",
                                      "Tidak Sesuai",
                                      "Kurang Sesuai",
                                      "Cukup Sesuai",
                                      "Sesuai",
                                      "Sangat Sesuai",
                                      "Sepenuhnya Sesuai"
                                   ];
                                   
                                   return (
                                      <button 
                                         key={val}
                                         onClick={() => handleStarClick(currentQ.id, val)}
                                         className="group relative transition-transform hover:scale-125 focus:outline-none"
                                      >
                                         {/* Tooltip */}
                                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-ink text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl z-20 scale-50 group-hover:scale-100 origin-bottom">
                                            <span className="relative z-10">{val}. {labels[i] || labels[labels.length-1]}</span>
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-ink" />
                                         </div>

                                         <Star 
                                            size={48} 
                                            className={`transition-all duration-300 ${
                                               isSelected 
                                               ? 'fill-[var(--yellow)] text-[var(--yellow)] drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' 
                                               : 'fill-transparent text-line-2 group-hover:text-[var(--yellow-soft)] group-hover:fill-[var(--yellow-soft)]'
                                            }`} 
                                         />
                                      </button>
                                   )
                                })}
                             </div>

                             <span className="hidden md:block text-[10px] font-black text-ink-4 uppercase tracking-[0.2em] text-left w-32 leading-snug">
                                {currentQ.maxLabel}
                             </span>
                          </div>

                          {/* Mobile Labels */}
                          <div className="flex md:hidden justify-between w-full px-4">
                             <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wider">{currentQ.minLabel}</span>
                             <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wider">{currentQ.maxLabel}</span>
                          </div>
                       </div>
                    )}

                    {currentQ.type === 'textarea' && (
                       <div className="w-full">
                         <textarea 
                            className="w-full bg-white/60 border-2 border-line-2 rounded-[20px] p-5 text-[15px] font-medium text-ink focus:border-[var(--red)] focus:bg-white focus:outline-none transition-all resize-none h-[140px] shadow-inner"
                            placeholder={currentQ.placeholder}
                            value={answers[currentQ.id] || ''}
                            onChange={(e) => setAnswers({...answers, [currentQ.id]: e.target.value})}
                         />
                       </div>
                    )}
                  </div>
               </div>

               {/* Wizard Navigation */}
               <div className="mt-6 flex items-center justify-between">
                  <button 
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="btn-ghost h-12 px-6 text-sm rounded-xl font-bold flex items-center gap-2 disabled:opacity-0 transition-opacity"
                  >
                    <ChevronLeft size={18} /> Sebelumnya
                  </button>

                  {isLastQuestion ? (
                    <button 
                      onClick={goToConfirm} 
                      disabled={!isCurrentAnswered()}
                      className="btn-primary h-12 px-8 text-sm rounded-xl group flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_-8px_rgba(220,38,38,0.6)]"
                    >
                      Selesai & Review <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext} 
                      disabled={!isCurrentAnswered()}
                      className="btn-primary h-12 px-8 text-sm rounded-xl group flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_-8px_rgba(220,38,38,0.6)]"
                    >
                      Selanjutnya <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
               </div>
            </div>
         )}

         {step === "confirm" && (
            <div className="glass p-12 md:p-16 text-center animate-in zoom-in-95 duration-500 flex flex-col items-center mt-4">
               <div className="w-20 h-20 bg-yellow-100 text-[var(--yellow)] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
                  <AlertTriangle size={40} strokeWidth={2.5} />
               </div>
               <h2 className="text-2xl font-black text-ink mb-3 tracking-tight">Konfirmasi Pengiriman</h2>
               <p className="text-ink-3 max-w-md mx-auto mb-10 text-sm leading-relaxed">
                 Anda telah menjawab <strong>semua {questions.length} pertanyaan</strong> asesmen. Apakah Anda yakin semua jawaban sudah sesuai dan ingin mengirimkannya sekarang?
               </p>
               <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                 <button 
                   onClick={() => setStep("form")}
                   className="btn-ghost h-14 rounded-[20px] px-8 text-sm font-bold flex-1"
                   disabled={submitting}
                 >
                   Cek Ulang Jawaban
                 </button>
                 <button 
                   onClick={handleSubmit}
                   disabled={submitting}
                   className="btn-primary h-14 rounded-[20px] px-10 text-sm font-bold flex-1 flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.6)]"
                 >
                   {submitting ? (
                     <><Loader2 className="animate-spin" size={20} /> Mengirim...</>
                   ) : (
                     <>Ya, Kirim Sekarang <CheckCircle2 size={20} strokeWidth={2.5} /></>
                   )}
                 </button>
               </div>
            </div>
         )}

         {step === "view" && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
               <div className="glass p-8 mb-8 border-line-2 bg-white/60">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-ink tracking-tight">{template.title}</h1>
                        <p className="text-ink-3 text-sm font-medium flex items-center gap-2">
                          <Calendar size={14} /> 
                          Selesai pada {assessment.submitted_at ? new Date(assessment.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                   </div>
                   <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-2">
                     <Eye size={14} /> Terkirim
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 {questions.map((q: any, idx: number) => (
                    <div key={q.id} className="glass p-6 md:p-8 border-line-2 bg-white/40">
                       <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                         <div className="flex-1">
                           <span className="text-[10px] font-black tracking-widest text-[var(--red)] uppercase mb-2 block">
                             {q.section || template.category}
                           </span>
                           <h3 className="text-lg font-bold text-ink leading-snug">
                             {idx + 1}. {q.question}
                           </h3>
                         </div>
                       </div>

                       <div className="pl-0 md:pl-6 border-l-2 border-line-2">
                          {q.type === 'scale' ? (
                            <div className="flex items-center gap-2">
                               {Array.from({ length: q.maxScore }).map((_, i) => {
                                 const val = i + 1;
                                 const isSelected = answers[q.id] >= val;
                                 return (
                                   <Star 
                                     key={val}
                                     size={24} 
                                     className={isSelected ? 'fill-[var(--yellow)] text-[var(--yellow)]' : 'fill-transparent text-line-2'} 
                                   />
                                 )
                               })}
                               <span className="ml-4 text-sm font-black text-ink">
                                 Skor: {answers[q.id] || '-'}
                               </span>
                            </div>
                          ) : (
                            <div className="bg-line-1/50 p-4 rounded-xl border border-line-2">
                               <p className="text-sm font-medium text-ink-2 italic whitespace-pre-wrap leading-relaxed">
                                 "{answers[q.id] || '(Tidak ada jawaban)'}"
                               </p>
                            </div>
                          )}
                       </div>
                    </div>
                 ))}
               </div>

               <div className="mt-12 flex justify-center pb-12">
                  <Link 
                    href="/employee/assessments"
                    className="btn-ghost h-14 px-12 rounded-[20px] font-black text-ink flex items-center gap-2 hover:bg-white"
                  >
                    <ChevronLeft size={20} /> Kembali ke Dashboard
                  </Link>
               </div>
            </div>
         )}

         {step === "success" && (
            <div className="glass-strong p-16 text-center animate-in zoom-in-95 duration-700 flex flex-col items-center mt-10 shadow-2xl">
               <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center mb-8 shadow-[0_15px_40px_-10px_rgba(22,163,74,0.5)]">
                  <CheckCircle2 size={56} strokeWidth={2.5} />
               </div>
               <h2 className="text-3xl font-black text-ink mb-4 tracking-tight">Terima Kasih!</h2>
               <p className="text-ink-3 max-w-md mx-auto mb-10 text-[15px] leading-relaxed">
                 Jawaban asesmen Anda telah berhasil disimpan. Terima kasih atas waktu dan dedikasi Anda dalam proses evaluasi ini.
               </p>
               <Link href="/employee/assessments" className="btn-ghost h-14 rounded-[20px] px-10 text-[15px] font-bold flex items-center gap-2 hover:bg-white/80">
                 <ChevronLeft size={18} /> Kembali ke Pusat Penilaian
               </Link>
            </div>
         )}
      </div>
    </div>
  );
}
