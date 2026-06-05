"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { X, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { DocumentCategory, EmployeeDocument } from "@/lib/dummy-data";

interface DocumentFormValues {
  title: string;
  category: DocumentCategory;
  subCategory?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: EmployeeDocument;
}

const CATEGORIES: DocumentCategory[] = [
  "Pendidikan",
  "Pelatihan",
  "Prestasi",
  "Identitas",
  "Pekerjaan",
  "Lainnya",
];

export default function DocumentModal({ open, onClose, onSave, initialData }: Props) {
  const { register, handleSubmit, reset } = useForm<DocumentFormValues>({
    defaultValues: {
      title: "",
      category: "Lainnya",
      subCategory: "",
    },
  });

  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync initial data and handle escape key
  useEffect(() => {
    if (open) {
      if (initialData) {
        console.log("Editing document, initial data:", initialData);
        reset({
          title: initialData.title,
          category: initialData.category,
          subCategory: initialData.subCategory || "",
        });
        setFiles([]);
        
        // Handle legacy and new file structure
        let initialFiles: any[] = [];
        if (initialData.files && initialData.files.length > 0) {
          initialFiles = [...initialData.files];
        } else if (initialData.fileUrl) {
          initialFiles = [{ 
            url: initialData.fileUrl, 
            name: "File Utama", 
            size: initialData.size || "Unknown", 
            type: initialData.type || "FILE" 
          }];
        }
        
        console.log("Setting existing files in modal:", initialFiles);
        setExistingFiles(initialFiles);
      } else {
        reset({ title: "", category: "Lainnya", subCategory: "" });
        setFiles([]);
        setExistingFiles([]);
      }
      setError(null);
      setLoading(false);
    }
  }, [open, initialData, reset]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !loading) {
        onClose();
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose, loading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: DocumentFormValues) => {
    if (files.length === 0 && existingFiles.length === 0) {
      setError("Silakan pilih minimal satu file untuk diunggah.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("category", values.category);
      if (values.subCategory) formData.append("subCategory", values.subCategory);
      
      files.forEach(f => formData.append("file", f));
      formData.append("existingFiles", JSON.stringify(existingFiles));
      
      if (initialData) formData.append("id", initialData.id);

      await onSave(formData);
      reset();
      setFiles([]);
      onClose();
    } catch (err: any) {
      console.error("Upload error caught in modal:", err);
      setError(err.message || "Gagal menyimpan dokumen. Pastikan ukuran file tidak melebihi batas 50MB.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[4px] animate-in fade-in duration-300">
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_32px_64px_rgba(0,0,0,0.3)] rounded-[28px] border border-line-2 relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-ink tracking-tight">
                {initialData ? "Ubah Dokumen" : "Tambah Dokumen"}
              </h2>
              <p className="text-[12px] font-medium text-ink-3 mt-0.5">Lengkapi arsip digital Anda dengan data yang valid.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-line-2 hover:bg-ink hover:text-white transition-all duration-300 shadow-sm"
              title="Tutup (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 pt-2 flex flex-col gap-5 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3 text-red-600 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-black text-[13px] mb-0.5">Gagal Mengunggah</div>
                <div className="text-[11px] font-medium opacity-90 leading-tight">{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-3 mb-1.5 block ml-1">Nama Dokumen</label>
              <input
                type="text"
                {...register("title", { required: true })}
                placeholder="Contoh: Ijazah S1 Teknik Informatika"
                className="w-full px-5 py-3 bg-line-2 border-2 border-transparent rounded-xl focus:bg-white focus:border-ink transition-all duration-300 text-[14px] font-bold text-ink placeholder:text-ink-4 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-3 mb-1.5 block ml-1">Kategori</label>
                <div className="relative">
                  <select
                    {...register("category")}
                    className="w-full px-5 py-3 bg-line-2 border-2 border-transparent rounded-xl focus:bg-white focus:border-ink transition-all duration-300 text-[14px] font-bold text-ink appearance-none cursor-pointer outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-3 mb-1.5 block ml-1">Keterangan</label>
                <input
                  type="text"
                  {...register("subCategory")}
                  placeholder="Misal: Tahun 2021"
                  className="w-full px-5 py-3 bg-line-2 border-2 border-transparent rounded-xl focus:bg-white focus:border-ink transition-all duration-300 text-[14px] font-bold text-ink placeholder:text-ink-4 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-ink-3 mb-1.5 block ml-1">File Bukti</label>
            
            {/* List of files */}
            {(files.length > 0 || existingFiles.length > 0) && (
              <div className="mb-4 space-y-2">
                {existingFiles.map((f, i) => (
                  <div key={`existing-${i}`} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-blue-500" />
                      <div>
                        <div className="text-[13px] font-bold text-ink truncate max-w-[200px]">{f.name}</div>
                        <div className="text-[10px] font-medium text-blue-400">{f.size} · Existing</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeExistingFile(i)} className="p-1 hover:bg-blue-100 rounded text-blue-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {files.map((f, i) => (
                  <div key={`new-${i}`} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-green-500" />
                      <div>
                        <div className="text-[13px] font-bold text-ink truncate max-w-[200px]">{f.name}</div>
                        <div className="text-[10px] font-medium text-green-400">{(f.size / (1024 * 1024)).toFixed(2)} MB · New</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-green-100 rounded text-green-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[24px] p-6 transition-all duration-500 flex flex-col items-center justify-center text-center cursor-pointer group overflow-hidden ${
                dragActive
                  ? "border-ink bg-line-2 scale-[0.98]"
                  : "border-line-2 hover:border-ink-3 hover:bg-line-2/50"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="w-12 h-12 rounded-[18px] bg-red-50 flex items-center justify-center text-[var(--red)] mb-2 group-hover:scale-110 transition-all duration-500">
                <Upload size={20} />
              </div>
              <div className="font-black text-ink text-[14px]">
                {files.length > 0 || existingFiles.length > 0 ? "Tambah File Lagi" : "Pilih File Dokumen"}
              </div>
              <div className="text-[10px] font-bold text-ink-3 mt-1 flex items-center gap-2">
                <FileText size={12} /> PDF, JPG, PNG (Maks 50MB)
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,image/*"
                multiple
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-auto pt-4 border-t border-line-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3.5 rounded-xl text-[14px] font-black text-ink-2 hover:bg-line-2 transition-all duration-300 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] px-6 py-3.5 rounded-xl text-[14px] font-black text-white bg-ink hover:bg-black shadow-xl shadow-ink/10 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-[2px] border-white/20 border-t-white rounded-full animate-spin" />
                  Proses...
                </>
              ) : (
                <>
                  <Upload size={16} strokeWidth={3} />
                  Simpan Dokumen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
