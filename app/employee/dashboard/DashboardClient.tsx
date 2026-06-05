"use client";

import { useState, type ReactNode } from "react";
import {
  Camera,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Pencil,
} from "lucide-react";
import { dummyUserProfile } from "@/lib/dummy-data";
import DashboardLayout from "@/components/common/DashboardLayout";
import EditSectionModals, { type EditSectionKey } from "@/components/profile-edit/EditSectionModals";
import AvatarUploadModal from "@/components/profile-edit/AvatarUploadModal";

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
      { icon: "📅", label: "Cuti", href: "/employee/cuti", isComingSoon: true },
      { icon: "💰", label: "Payroll", href: "/employee/payroll", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/employee/settings", isComingSoon: true },
    ],
  },
];

const TABS = [
  { key: "personal", label: "Personal", icon: User },
  { key: "pekerjaan", label: "Pekerjaan", icon: Briefcase },
  { key: "edukasi", label: "Edukasi & Skills", icon: GraduationCap },
  { key: "aktivitas", label: "Aktivitas & Prestasi", icon: Award },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const fmtRange = (start: string, end: string) =>
  `${fmtDate(start)} – ${end ? fmtDate(end) : "Sekarang"}`;

const fmtYearRange = (start: string, end: string) =>
  `${start || "—"} – ${end || "Sekarang"}`;

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">{label}</div>
      <div className="text-sm text-ink mt-1">{value || "—"}</div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  onEdit,
  children,
}: {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="glass p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="font-bold text-ink m-0">{title}</h3>
          {subtitle && <p className="text-sm text-ink-3 mt-1">{subtitle}</p>}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title={`Edit ${title}`}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-ink-3 hover:bg-line hover:text-ink transition-colors"
          >
            <Pencil size={14} strokeWidth={2.25} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ListCard({ children }: { children: ReactNode }) {
  return <div className="border border-line-2 rounded-xl p-4">{children}</div>;
}

import { updateEmployeeProfile, uploadAvatar } from "./actions";

export default function UserDashboard({ initialData }: { initialData: typeof dummyUserProfile }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [editingSection, setEditingSection] = useState<EditSectionKey | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleSaveData = async (updates: Partial<typeof dummyUserProfile>) => {
    // Optimistic UI update
    setData((prev) => ({ ...prev, ...updates }));
    
    // Save to Supabase
    if (editingSection) {
      try {
        await updateEmployeeProfile(editingSection, updates);
      } catch (error) {
        console.error("Failed to update profile", error);
        // Optionally revert data here
      }
    }
    
    setEditingSection(null);
  };

  const handleSaveAvatar = async (base64Image: string) => {
    // Optimistic UI update
    setData((prev) => ({ ...prev, photo: base64Image }));
    
    // Upload to Supabase
    try {
      await uploadAvatar(base64Image);
    } catch (error) {
      console.error("Failed to upload avatar", error);
    }
  };

  return (
    <DashboardLayout
      role="Karyawan"
      userName={data.name}
      userInitials={data.initials}
      menuSections={EMPLOYEE_MENU}
    >
      {/* Page Header — merged profile card */}
      <div className="page-head">
        <div className="avatar shrink-0 overflow-hidden relative">
          {data.photo ? (
            <img src={data.photo} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            data.initials
          )}
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            title="Ubah foto"
            className="absolute bottom-1.5 right-1.5 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface-focus)] text-[var(--red)] shadow-md hover:opacity-90 transition-all z-10"
          >
            <Camera size={16} strokeWidth={2.25} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <span className="eyebrow">Profil Karyawan</span>
          <h1>Halo, {data.name} 👋</h1>
          <div className="mt-1 text-[var(--ink-3)] text-[13px] flex gap-2 items-center flex-wrap">
            <span>{data.title}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--ink-4)]" />
            <span>{data.dept}</span>
          </div>
          <div className="mt-2.5 flex gap-1.5 flex-wrap">
            <span className="badge badge-green">{data.status}</span>
            <span className="badge badge-yellow">{data.level}</span>
            <span className="badge badge-ink">{data.employeeCode}</span>
          </div>
          <p className="!mt-3">Kelola data pribadi dan kepegawaian Anda di sini.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                isActive
                  ? "bg-[var(--red)] text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.6)]"
                  : "bg-[var(--surface-item)] text-[var(--ink-2)] border border-line-2 hover:bg-[rgba(255,255,255,0.08)]"
              }`}
            >
              <Icon size={16} strokeWidth={2.25} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-4">
        {activeTab === "personal" && (
          <>
            <SectionCard
              title="Data Personal"
              subtitle="Identitas dan kontak Anda."
              onEdit={() => setEditingSection("personal")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Email" value={data.email} />
                <Field label="Telepon" value={data.phone} />
                <Field label="NIK" value={data.nik} />
                <Field label="Tanggal Lahir" value={fmtDate(data.birth)} />
                <Field label="Jenis Kelamin" value={data.gender} />
                <Field label="Golongan Darah" value={data.bloodType} />
                <Field label="Kewarganegaraan" value={data.nationality} />
                <Field label="Status Pernikahan" value={data.maritalStatus} />
                <Field label="Agama" value={data.religion} />
              </div>
              <div className="h-px bg-line my-5" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <Field label="Alamat Sesuai KTP" value={data.ktpAddress} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Alamat Domisili" value={data.address} />
                </div>
                <Field label="Kota" value={data.city} />
                <Field label="Provinsi" value={data.province} />
                <Field label="Kode Pos" value={data.postalCode} />
                <Field label="Negara" value={data.country} />
              </div>
            </SectionCard>

            <SectionCard 
              title="Informasi Bank" 
              subtitle="Data pembayaran gaji Anda."
              onEdit={() => setEditingSection("bank")}
            >
              <div className="grid grid-cols-1 gap-x-6 gap-y-4">
                <Field label="Rekening Bank" value={data.bank} />
              </div>
            </SectionCard>

            <SectionCard 
              title="Keluarga" 
              subtitle={`${data.family.length} anggota keluarga terdaftar.`}
              onEdit={() => setEditingSection("family")}
            >
              <div className="grid gap-3">
                {data.family.map((f) => (
                  <ListCard key={f.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{f.name}</div>
                        <div className="text-xs text-ink-3 mt-0.5">{f.occupation}</div>
                      </div>
                      <span className="badge badge-ink">{f.relationship}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4">
                      <Field label="Tanggal Lahir" value={fmtDate(f.birthDate)} />
                      <Field label="Telepon" value={f.phone} />
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Kontak Darurat" 
              subtitle="Hubungi bila terjadi keadaan darurat."
              onEdit={() => setEditingSection("emergency-contacts")}
            >
              <div className="grid gap-3">
                {data.emergencyContacts.map((c) => (
                  <ListCard key={c.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="font-bold text-ink text-[15px]">{c.name}</div>
                      <span className="badge badge-ink">{c.relationship}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4">
                      <Field label="Telepon" value={c.phone} />
                      <Field label="Alamat" value={c.address} />
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === "pekerjaan" && (
          <>
            <SectionCard 
              title="Informasi Pekerjaan" 
              subtitle="Status dan posisi Anda saat ini."
              onEdit={() => setEditingSection("employment")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Nomor Induk Karyawan" value={data.employeeCode} />
                <Field label="Jabatan" value={data.title} />
                <Field label="Departemen" value={data.dept} />
                <Field label="Level" value={data.level} />
                <Field label="Status" value={data.status} />
                <Field label="Tanggal Masuk" value={fmtDate(data.join)} />
                <Field label="Masa Kerja" value={(() => {
                  if (!data.join) return "—";
                  const start = new Date(data.join);
                  const now = new Date();
                  let years = now.getFullYear() - start.getFullYear();
                  let months = now.getMonth() - start.getMonth();
                  if (months < 0) {
                    years--;
                    months += 12;
                  }
                  const parts = [];
                  if (years > 0) parts.push(`${years} Tahun`);
                  if (months > 0) parts.push(`${months} Bulan`);
                  return parts.length > 0 ? parts.join(" ") : "Kurang dari 1 bulan";
                })()} />
                <Field label="Atasan Langsung" value={data.manager} />
              </div>
            </SectionCard>

            <SectionCard 
              title="Pengalaman Kerja" 
              subtitle="Riwayat karier sebelumnya dan saat ini."
              onEdit={() => setEditingSection("work-experience")}
            >
              <div className="grid gap-3">
                {data.workExperience.map((w) => (
                  <ListCard key={w.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{w.position}</div>
                        <div className="text-sm text-ink-2 mt-0.5">{w.company}</div>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">{fmtYearRange(w.startDate, w.endDate)}</span>
                    </div>
                    <p className="text-sm text-ink-2 mt-3 leading-relaxed">{w.description}</p>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Promosi & Mutasi" 
              subtitle="Riwayat perubahan posisi internal."
              onEdit={() => setEditingSection("promotion-history")}
            >
              <div className="grid gap-2">
                {data.promotionHistory.map((p) => (
                  <ListCard key={p.id}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="badge badge-green">{p.type}</span>
                      <div className="flex-1 min-w-0 text-sm text-ink-2">
                        <span className="text-ink-3">{p.from}</span>
                        <span className="mx-2">→</span>
                        <span className="font-bold text-ink">{p.to}</span>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">{p.date}</span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Peminatan Karier" 
              subtitle="Posisi yang ingin Anda capai ke depan."
              onEdit={() => setEditingSection("career-interests")}
            >
              <div className="flex flex-wrap gap-2">
                {data.careerInterests.map((c) => (
                  <span key={c.id} className="badge badge-ink">
                    {c.position} · {c.department}
                  </span>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === "edukasi" && (
          <>
            <SectionCard 
              title="Pendidikan Formal" 
              subtitle="Latar belakang pendidikan akademik."
              onEdit={() => setEditingSection("education")}
            >
              <div className="grid gap-3">
                {data.education.map((e) => (
                  <ListCard key={e.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{e.institution}</div>
                        <div className="text-sm text-ink-2 mt-0.5">
                          {e.level} · {e.field}
                        </div>
                      </div>
                      <span className="badge badge-ink">{e.year}</span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Pendidikan Non-Formal" 
              subtitle="Kursus dan sertifikasi pendukung."
              onEdit={() => setEditingSection("non-formal-education")}
            >
              <div className="grid gap-3">
                {data.nonFormalEducation.map((e) => (
                  <ListCard key={e.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{e.name}</div>
                        <div className="text-sm text-ink-2 mt-0.5">{e.institution}</div>
                      </div>
                      <span className="badge badge-ink">{e.year}</span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Training & Sertifikasi" 
              subtitle="Program pelatihan yang pernah diikuti."
              onEdit={() => setEditingSection("training")}
            >
              <div className="grid gap-3">
                {data.training.map((t) => (
                  <ListCard key={t.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{t.name}</div>
                        <div className="text-sm text-ink-2 mt-0.5">{t.provider}</div>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">{t.date}</span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Bahasa" 
              subtitle="Kemampuan berbahasa yang dikuasai."
              onEdit={() => setEditingSection("languages")}
            >
              <div className="flex flex-wrap gap-2">
                {data.languages.map((l) => (
                  <span key={l.id} className="badge badge-ink">
                    {l.name} · <span className="text-ink-3">{l.proficiency}</span>
                  </span>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Skills & Keahlian" 
              subtitle="Kompetensi teknis dan non-teknis."
              onEdit={() => setEditingSection("skills")}
            >
              <div className="flex flex-wrap gap-2">
                {data.skills.map((s) => (
                  <span key={s.id} className="badge badge-ink">
                    {s.name} · <span className="text-ink-3">{s.proficiency}</span>
                  </span>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === "aktivitas" && (
          <>
            <SectionCard 
              title="Pengalaman Organisasi" 
              subtitle="Keterlibatan dalam komunitas atau organisasi."
              onEdit={() => setEditingSection("org-experience")}
            >
              <div className="grid gap-3">
                {data.orgExperience.map((o) => (
                  <ListCard key={o.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{o.organization}</div>
                        <div className="text-sm text-ink-2 mt-0.5">{o.role}</div>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">{o.period}</span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Aktivitas Sosial" 
              subtitle="Kegiatan kerelawanan dan kontribusi sosial."
              onEdit={() => setEditingSection("social-activities")}
            >
              <div className="grid gap-3">
                {data.socialActivities.map((a) => (
                  <ListCard key={a.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{a.activity}</div>
                        <div className="text-sm text-ink-2 mt-0.5">
                          {a.organization} · {a.role}
                        </div>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">
                        {a.startDate} {a.endDate ? `– ${a.endDate}` : "– Sekarang"}
                      </span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Pengalaman Kepanitiaan" 
              subtitle="Keterlibatan sebagai panitia event internal/eksternal."
              onEdit={() => setEditingSection("committee-experience")}
            >
              <div className="grid gap-3">
                {(data.committeeExperience || []).map((c) => (
                  <ListCard key={c.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{c.event}</div>
                        <div className="text-sm text-ink-2 mt-0.5">{c.role}</div>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">{c.year}</span>
                    </div>
                  </ListCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard 
              title="Prestasi" 
              subtitle="Penghargaan dan pencapaian."
              onEdit={() => setEditingSection("achievements")}
            >
              <div className="grid gap-3">
                {data.achievements.map((a) => (
                  <ListCard key={a.id}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-ink text-[15px]">{a.title}</div>
                        <div className="text-sm text-ink-2 mt-0.5">Tingkat: {a.level}</div>
                      </div>
                      <span className="text-xs text-ink-3 whitespace-nowrap">{a.date}</span>
                    </div>
                    <p className="text-sm text-ink-2 mt-3 leading-relaxed">{a.description}</p>
                  </ListCard>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        <div className="glass p-6 bg-hris-yellow-soft/20 border-hris-yellow/30">
          <div className="flex gap-3">
            <span className="text-2xl">🚧</span>
            <div>
              <h4 className="font-bold text-yellow-ink text-sm">Fitur Dalam Pengembangan</h4>
              <p className="text-xs text-yellow-ink opacity-80">Beberapa menu sedang dalam tahap perencanaan dan akan segera hadir.</p>
            </div>
          </div>
        </div>
      </div>

      <AvatarUploadModal
        open={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleSaveAvatar}
      />

      {editingSection && (
        <EditSectionModals
          section={editingSection}
          data={data}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveData}
        />
      )}
    </DashboardLayout>
  );
}
