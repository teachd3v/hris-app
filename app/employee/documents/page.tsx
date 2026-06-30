"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  FileText, 
  Loader2, 
  Files, 
  GraduationCap, 
  Award, 
  Trophy, 
  UserCircle, 
  Briefcase, 
  MoreHorizontal 
} from "lucide-react";
import DashboardLayout from "@/components/common/DashboardLayout";
import { DocumentCategory, EmployeeDocument } from "@/lib/dummy-data";
import DocumentModal from "@/components/documents/DocumentModal";
import PreviewModal from "@/components/documents/PreviewModal";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import { getDocuments, uploadDocument, deleteDocument } from "./actions";
import { createClient } from "@/lib/supabase/client";

const EMPLOYEE_MENU = [
  {
    label: "Utama",
    items: [
      { icon: "👤", label: "Profil Saya", href: "/employee/dashboard" },
      { icon: "📄", label: "Dokumen", href: "/employee/documents" },
      { icon: "📋", label: "Asesmen", href: "/employee/assessments" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { icon: "🏠", label: "Beranda", href: "/employee/beranda", isComingSoon: true },
      { icon: "⏰", label: "Presensi", href: "/employee/presensi", isComingSoon: true },
      { icon: "📅", label: "Cuti", href: "/employee/cuti" },
      { icon: "💰", label: "Payroll", href: "/employee/payroll", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/employee/settings", isComingSoon: true },
    ],
  },
];

const TABS: { key: DocumentCategory | "Semua"; label: string; icon: any }[] = [
  { key: "Semua", label: "Semua", icon: Files },
  { key: "Pendidikan", label: "Pendidikan", icon: GraduationCap },
  { key: "Pelatihan", label: "Pelatihan", icon: Award },
  { key: "Prestasi", label: "Prestasi", icon: Trophy },
  { key: "Identitas", label: "Identitas", icon: UserCircle },
  { key: "Pekerjaan", label: "Pekerjaan", icon: Briefcase },
  { key: "Lainnya", label: "Lainnya", icon: MoreHorizontal },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DocumentCategory | "Semua">("Semua");
  const [userProfile, setUserProfile] = useState({ name: "User", initials: "U", photo: "" });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<EmployeeDocument | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<EmployeeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: emp } = await supabase.from('employees').select('name, photo_url').eq('id', user.id).single();
      if (emp) {
        setUserProfile({
          name: emp.name,
          initials: emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          photo: emp.photo_url || ""
        });
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchData();
  }, [fetchUser, fetchData]);

  const filteredDocs = documents.filter(
    (doc) => activeTab === "Semua" || doc.category === activeTab
  );

  const handleSaveDocument = async (formData: FormData) => {
    await uploadDocument(formData);
    await fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteDoc.id, deleteDoc.fileUrl || "");
      await fetchData();
      setDeleteDoc(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Gagal menghapus dokumen.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingDoc(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (doc: EmployeeDocument) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout
      role="Karyawan"
      userName={userProfile.name}
      userInitials={userProfile.initials}
      userPhoto={userProfile.photo}
      menuSections={EMPLOYEE_MENU}
    >
      <div className="page-head flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Pusat Dokumen</span>
          <h1>Dokumen Saya</h1>
          <p>Arsip digital untuk memverifikasi data profil Anda.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--red)] text-white rounded-full font-bold hover:bg-[var(--red-hover)] transition-all shadow-lg hover:shadow-red-500/20 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          Tambah Dokumen
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-2 -mx-2 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all border whitespace-nowrap ${
                isActive
                  ? "bg-[var(--red)] text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.6)] border-[var(--red)] scale-105"
                  : "bg-white/50 text-ink-3 border-line-2 hover:bg-white/80 hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 3 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass p-20 flex flex-col items-center justify-center text-center">
          <Loader2 size={40} className="text-ink-3 animate-spin mb-4" />
          <p className="text-ink-3 font-medium">Memuat dokumen...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass p-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-line-2 rounded-full flex items-center justify-center mb-6 text-3xl">
            📄
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">Belum ada dokumen</h3>
          <p className="text-ink-3 max-w-xs mx-auto">
            {activeTab === "Semua" 
              ? "Unggah ijazah, sertifikat, atau dokumen identitas Anda untuk melengkapi profil."
              : `Tidak ada dokumen ditemukan di kategori ${activeTab}.`}
          </p>
          <button 
            onClick={openAddModal}
            className="mt-6 text-[var(--red)] font-bold hover:underline"
          >
            Mulai unggah sekarang →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass p-5 flex flex-col gap-4 hover:-translate-y-1.5 hover:shadow-2xl transition-all group relative border-white/40"
            >
              {/* Actions Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-line shadow-xl z-10 translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-2 text-ink-3 hover:text-ink hover:bg-line-2 rounded-lg transition-colors"
                  title="Lihat Detail"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleEdit(doc)}
                  className="p-2 text-ink-3 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ubah Dokumen"
                >
                  <Edit2 size={18} />
                </button>
                <div className="w-px h-5 bg-line mx-0.5" />
                <button
                  onClick={() => setDeleteDoc(doc)}
                  className="p-2 text-ink-3 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Dokumen"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex justify-between items-start">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-[13px] shadow-inner ${
                  doc.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {doc.type === 'PDF' ? <FileText size={28} /> : doc.type}
                </div>
              </div>
              
              <div className="mt-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-white bg-ink px-2.5 py-1 rounded-md">
                    {doc.category}
                  </span>
                  {doc.subCategory && (
                    <span className="text-[10px] font-bold text-ink-3 bg-white/60 px-2.5 py-1 rounded-md border border-line-2 truncate max-w-[140px]">
                      {doc.subCategory}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-ink text-lg leading-tight line-clamp-2 min-h-[3.5rem]" title={doc.title}>
                  {doc.title}
                </h4>
                <div className="flex justify-between items-center text-[11px] text-ink-3 mt-4 font-bold border-t border-line-2 pt-3">
                  <span className="bg-line-2 px-2 py-0.5 rounded uppercase">{doc.size}</span>
                  <span className="text-ink-4">{doc.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDocument}
        initialData={editingDoc}
      />

      <PreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <DeleteConfirmModal
        open={!!deleteDoc}
        loading={isDeleting}
        onClose={() => setDeleteDoc(null)}
        onConfirm={confirmDelete}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus "${deleteDoc?.title}"? File ini akan dihapus permanen dari server.`}
      />
    </DashboardLayout>
  );
}
