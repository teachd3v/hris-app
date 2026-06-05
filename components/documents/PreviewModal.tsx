"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Download, FileText, Image as ImageIcon, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { EmployeeDocument } from "@/lib/dummy-data";

interface Props {
  document: EmployeeDocument | null;
  onClose: () => void;
}

export default function PreviewModal({ document, onClose }: Props) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  useEffect(() => {
    setActiveFileIndex(0);
  }, [document]);

  if (!document) return null;

  const files = document.files && document.files.length > 0 
    ? document.files 
    : (document.fileUrl ? [{ url: document.fileUrl, name: document.title, size: document.size, type: document.type }] : []);

  const activeFile = files[activeFileIndex];
  const fileUrl = activeFile?.url || "";
  const isImage = activeFile?.type === "IMG" || /\.(jpg|jpeg|png|webp)$/i.test(fileUrl);
  const isPdf = activeFile?.type === "PDF" || /\.pdf$/i.test(fileUrl);

  const nextFile = () => setActiveFileIndex((prev) => (prev + 1) % files.length);
  const prevFile = () => setActiveFileIndex((prev) => (prev - 1 + files.length) % files.length);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_32px_64px_rgba(0,0,0,0.4)] rounded-[32px] border border-line-2">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line-2 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[var(--red)] shadow-inner">
              {isImage ? <ImageIcon size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-ink leading-tight tracking-tight">
                {document.title} {files.length > 1 && `(${activeFileIndex + 1}/${files.length})`}
              </h2>
              <p className="text-[13px] font-bold text-ink-3">
                {activeFile?.name || document.category} • {activeFile?.type || document.type} • {activeFile?.size || document.size}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fileUrl && (
              <>
                <a
                  href={fileUrl}
                  download
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-line-2 hover:bg-ink hover:text-white text-ink text-[13px] font-black transition-all duration-300 border border-transparent"
                  title="Unduh File"
                >
                  <Download size={18} strokeWidth={3} />
                  <span className="hidden md:inline">Unduh</span>
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-line-2 hover:bg-ink hover:text-white text-ink transition-all duration-300"
                  title="Buka di tab baru"
                >
                  <ExternalLink size={18} strokeWidth={2.5} />
                </a>
              </>
            )}
            <div className="w-px h-8 bg-line-2 mx-1" />
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500 hover:text-white text-ink-3 transition-all duration-300"
              title="Tutup (Esc)"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-line-2/30 relative overflow-hidden flex flex-col md:flex-row">
          {/* File Selector Sidebar (only if multiple files) */}
          {files.length > 1 && (
            <div className="w-full md:w-64 border-r border-line-2 bg-white overflow-y-auto shrink-0 p-4 space-y-2 hidden md:block">
              <div className="text-[10px] font-black uppercase tracking-widest text-ink-4 mb-4">Daftar File ({files.length})</div>
              {files.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFileIndex(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left group ${
                    activeFileIndex === i 
                      ? "bg-ink text-white shadow-lg shadow-ink/20 scale-[1.02]" 
                      : "hover:bg-line-2 text-ink"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activeFileIndex === i ? "bg-white/20" : "bg-line-2 group-hover:bg-white"
                  }`}>
                    {f.type === "PDF" || /\.pdf$/i.test(f.url) ? <FileText size={16} /> : <ImageIcon size={16} />}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[12px] font-bold truncate">{f.name}</div>
                    <div className={`text-[10px] ${activeFileIndex === i ? "text-white/60" : "text-ink-4"}`}>{f.size}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-auto">
            {/* Navigation Arrows for Mobile or quick switch */}
            {files.length > 1 && (
              <>
                <button 
                  onClick={prevFile}
                  className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-line-2 shadow-lg flex items-center justify-center text-ink hover:bg-white transition-all active:scale-90"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <button 
                  onClick={nextFile}
                  className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-line-2 shadow-lg flex items-center justify-center text-ink hover:bg-white transition-all active:scale-90"
                >
                  <ChevronRight size={24} strokeWidth={3} />
                </button>
              </>
            )}

            {fileUrl ? (
              isImage ? (
                <img
                  src={fileUrl}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 border-4 border-white"
                />
              ) : isPdf ? (
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  className="w-full h-full rounded-2xl bg-white shadow-2xl border-4 border-white"
                  title={document.title}
                />
              ) : (
                <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-sm border border-line-2">
                  <FileText size={64} className="mx-auto mb-4 text-ink-4" />
                  <h3 className="text-xl font-black text-ink mb-2">Format Tidak Didukung Preview</h3>
                  <p className="text-[13px] font-medium text-ink-3 mb-6 leading-relaxed">Silakan unduh file untuk melihat kontennya secara manual.</p>
                  <a
                    href={fileUrl}
                    download
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-ink text-white font-black hover:bg-black transition-all duration-300 shadow-lg shadow-ink/20"
                  >
                    <Download size={18} strokeWidth={3} />
                    Unduh Sekarang
                  </a>
                </div>
              )
            ) : (
              <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-sm border border-dashed border-line-2">
                <AlertCircle size={64} className="mx-auto mb-4 text-ink-4" />
                <h3 className="text-xl font-black text-ink-3 mb-1 tracking-tight">Preview Tidak Tersedia</h3>
                <p className="text-[13px] font-medium text-ink-4">File ini adalah data dummy tanpa dokumen fisik.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
