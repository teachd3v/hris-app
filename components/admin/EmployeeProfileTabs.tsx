"use client";

import { useState } from "react";

export default function EmployeeProfileTabs({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState("Personal");

  const tabs = ["Personal", "Pekerjaan", "Edukasi & Skills", "Aktivitas & Prestasi", "Dokumen"];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-black/5 rounded-2xl w-fit overflow-x-auto max-w-full">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab ? "bg-white text-ink shadow-sm" : "text-ink-3 hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "Personal" && <PersonalTab data={data} />}
        {activeTab === "Pekerjaan" && <WorkTab data={data} />}
        {activeTab === "Edukasi & Skills" && <EducationTab data={data} />}
        {activeTab === "Aktivitas & Prestasi" && <AchievementTab data={data} />}
        {activeTab === "Dokumen" && <DocumentTab data={data} />}
      </div>
    </div>
  );
}

function DocumentTab({ data }: { data: any }) {
  const { documents } = data;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents?.length > 0 ? documents.map((doc: any) => {
        const files = (doc.files && doc.files.length > 0) 
          ? doc.files 
          : (doc.file_url ? [{ url: doc.file_url, name: "File Utama", size: doc.size, type: doc.type }] : []);
        
        return (
          <div key={doc.id} className="glass p-5 flex flex-col gap-4 group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-2xl">
                {doc.type === 'PDF' ? '📕' : '🖼️'}
              </div>
              <div className="text-[10px] font-black text-ink-4 uppercase tracking-tighter">{doc.size || '0 KB'}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-hris-red uppercase tracking-wider mb-1">{doc.category}</div>
              <div className="font-bold text-ink truncate mb-1" title={doc.title}>{doc.title}</div>
              <div className="text-xs text-ink-3 font-medium">Diunggah: {doc.date}</div>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[9px] font-black text-ink-4 uppercase tracking-widest mb-1">Daftar File ({files.length})</div>
              {files.map((f: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <a 
                    href={f.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-black/5 hover:bg-black hover:text-white text-ink text-[11px] font-bold transition-all flex items-center justify-between group/link border border-transparent hover:border-black/10"
                  >
                    <span className="truncate flex-1 mr-2">{f.name || `File ${i+1}`}</span>
                    <span className="text-sm">👁️</span>
                  </a>
                  <a 
                    href={f.url} 
                    download
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-black/5 hover:bg-hris-red hover:text-white transition-all text-sm border border-transparent hover:border-black/10"
                    title="Download"
                  >
                    📥
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      }) : (
        <div className="col-span-full py-20 flex flex-col items-center gap-4 glass">
          <span className="text-4xl">📁</span>
          <div className="text-center">
            <div className="font-bold text-ink">Belum ada dokumen</div>
            <p className="text-xs text-ink-3">Karyawan belum mengunggah dokumen apapun.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalTab({ data }: { data: any }) {
  const { employee, family, emergency } = data;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SectionCard title="Data Personal">
        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
          <DataRow label="NIK (KTP)" value={employee.nik} />
          <DataRow label="Alamat KTP" value={employee.ktp_address} />
          <DataRow label="Tanggal Lahir" value={employee.birth_date} />
          <DataRow label="Jenis Kelamin" value={employee.gender} />
          <DataRow label="Golongan Darah" value={employee.blood_type} />
          <DataRow label="Agama" value={employee.religion} />
          <DataRow label="Status Marital" value={employee.marital_status} />
          <DataRow label="Kewarganegaraan" value={employee.nationality} />
          <DataRow label="Telepon" value={employee.phone} />
        </div>
        <div className="mt-4 pt-4 border-t border-black/5">
          <DataRow label="Alamat Lengkap" value={employee.address} />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <DataRow label="Kota" value={employee.city} />
            <DataRow label="Provinsi" value={employee.province} />
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-6">
        <SectionCard title="Informasi Perbankan">
          <DataRow label="Detail Rekening" value={employee.bank || "Belum diisi"} />
        </SectionCard>

        <SectionCard title="Kontak Darurat">
          <div className="flex flex-col gap-4">
            {emergency?.length > 0 ? emergency.map((c: any) => (
              <div key={c.id} className="p-3 rounded-xl bg-black/5 flex flex-col gap-1">
                <div className="font-bold text-ink text-sm">{c.name} ({c.relationship})</div>
                <div className="text-xs text-ink-3 font-medium">📞 {c.phone}</div>
                <div className="text-[10px] text-ink-3">{c.address}</div>
              </div>
            )) : <EmptyState text="Belum ada kontak darurat" />}
          </div>
        </SectionCard>
      </div>

      <div className="lg:col-span-2">
        <SectionCard title="Data Keluarga">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {family?.length > 0 ? family.map((f: any) => (
              <div key={f.id} className="p-4 rounded-2xl border border-black/5 bg-white/50">
                <div className="text-[10px] font-black text-hris-red uppercase tracking-wider mb-1">{f.relationship}</div>
                <div className="font-bold text-ink mb-1">{f.name}</div>
                <div className="text-xs text-ink-3 font-medium">🎂 {f.birth_date}</div>
                <div className="text-xs text-ink-3">💼 {f.occupation || '-'}</div>
              </div>
            )) : <EmptyState text="Belum ada data keluarga" />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function WorkTab({ data }: { data: any }) {
  const { employee, experience, promotions, interests } = data;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <SectionCard title="Informasi Pekerjaan">
          <div className="flex flex-col gap-4">
            <DataRow label="Tanggal Bergabung" value={employee.join_date} />
            <DataRow label="Masa Kerja" value={employee.tenure} />
            <DataRow label="Level Jabatan" value={employee.level} />
            <DataRow label="Manager Langsung" value={employee.manager} />
            <DataRow label="Status Kontrak" value={employee.status} />
          </div>
        </SectionCard>
        
        <SectionCard title="Peminatan Karir">
          <div className="flex flex-col gap-3">
            {interests?.length > 0 ? interests.map((i: any) => (
              <div key={i.id} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-xs font-bold text-blue-700">{i.position}</div>
                <div className="text-[10px] text-blue-600">{i.department}</div>
              </div>
            )) : <EmptyState text="Belum ada data" />}
          </div>
        </SectionCard>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
        <SectionCard title="Pengalaman Kerja">
          <div className="flex flex-col gap-4">
            {experience?.length > 0 ? experience.map((w: any) => (
              <div key={w.id} className="flex gap-4 p-4 rounded-2xl bg-black/5 relative">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">🏢</div>
                <div>
                  <div className="font-bold text-ink">{w.position}</div>
                  <div className="text-sm font-semibold text-ink-2">{w.company}</div>
                  <div className="text-xs text-ink-3 mt-1 font-medium">{w.start_date} - {w.end_date || 'Sekarang'}</div>
                  <p className="text-xs text-ink-3 mt-2 leading-relaxed">{w.description}</p>
                </div>
              </div>
            )) : <EmptyState text="Belum ada riwayat kerja" />}
          </div>
        </SectionCard>

        <SectionCard title="Riwayat Promosi & Mutasi">
          <div className="flex flex-col gap-4">
            {promotions?.length > 0 ? promotions.map((p: any) => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl border border-black/5">
                <div className="text-xl">📈</div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-green-600 uppercase mb-0.5">{p.type}</div>
                  <div className="font-bold text-ink leading-tight">{p.to_position}</div>
                  <div className="text-xs text-ink-3">Dari: {p.from_position || '-'}</div>
                </div>
                <div className="text-xs font-bold text-ink-3">{p.date}</div>
              </div>
            )) : <EmptyState text="Belum ada riwayat" />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function EducationTab({ data }: { data: any }) {
  const { education, nonFormal, skills, languages, training } = data;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SectionCard title="Pendidikan Formal">
        <div className="flex flex-col gap-4">
          {education?.length > 0 ? education.map((e: any) => (
            <div key={e.id} className="p-4 rounded-2xl bg-black/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-lg">🎓</div>
              <div>
                <div className="text-[10px] font-black text-hris-red uppercase">{e.level}</div>
                <div className="font-bold text-ink">{e.institution}</div>
                <div className="text-sm font-medium text-ink-2">{e.field}</div>
                <div className="text-xs font-bold text-ink-3 mt-1">{e.year}</div>
              </div>
            </div>
          )) : <EmptyState text="Belum ada data" />}
        </div>
      </SectionCard>

      <SectionCard title="Pelatihan & Sertifikasi">
        <div className="flex flex-col gap-4">
          {training?.length > 0 ? training.map((t: any) => (
            <div key={t.id} className="p-4 rounded-2xl border border-black/5 flex items-center gap-4">
              <div className="text-xl">📜</div>
              <div className="flex-1">
                <div className="font-bold text-ink">{t.name}</div>
                <div className="text-xs text-ink-3 font-medium">{t.provider}</div>
              </div>
              <div className="text-xs font-bold text-ink-3">{t.date}</div>
            </div>
          )) : <EmptyState text="Belum ada data" />}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
        <SectionCard title="Keahlian & Kemampuan">
          <div className="flex flex-wrap gap-2">
            {skills?.length > 0 ? skills.map((s: any) => (
              <div key={s.id} className="px-3 py-1.5 rounded-lg bg-white border border-black/5 shadow-sm">
                <div className="text-xs font-bold text-ink">{s.name}</div>
                <div className="text-[10px] font-medium text-hris-red uppercase">{s.proficiency}</div>
              </div>
            )) : <EmptyState text="Belum ada data" />}
          </div>
        </SectionCard>

        <SectionCard title="Kemampuan Bahasa">
          <div className="flex flex-col gap-3">
            {languages?.length > 0 ? languages.map((l: any) => (
              <div key={l.id} className="flex justify-between items-center p-3 rounded-xl bg-black/5">
                <div className="text-sm font-bold text-ink">{l.name}</div>
                <div className="text-[10px] font-black text-ink-3 uppercase bg-white px-2 py-0.5 rounded-md shadow-sm">{l.proficiency}</div>
              </div>
            )) : <EmptyState text="Belum ada data" />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AchievementTab({ data }: { data: any }) {
  const { achievements, orgs, social, committee } = data;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SectionCard title="Prestasi & Penghargaan">
        <div className="flex flex-col gap-4">
          {achievements?.length > 0 ? achievements.map((a: any) => (
            <div key={a.id} className="p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-transparent border-l-4 border-yellow-400">
              <div className="text-[10px] font-black text-yellow-700 uppercase mb-1">{a.date} · {a.issuer}</div>
              <div className="font-bold text-ink text-lg">{a.title}</div>
              <p className="text-xs text-ink-3 mt-1">{a.description}</p>
            </div>
          )) : <EmptyState text="Belum ada data" />}
        </div>
      </SectionCard>

      <SectionCard title="Pengalaman Organisasi">
        <div className="flex flex-col gap-4">
          {orgs?.length > 0 ? orgs.map((o: any) => (
            <div key={o.id} className="p-4 rounded-2xl bg-black/5">
              <div className="font-bold text-ink">{o.organization}</div>
              <div className="text-sm font-semibold text-hris-red">{o.role}</div>
              <div className="text-xs text-ink-3 font-medium mt-1">{o.period}</div>
            </div>
          )) : <EmptyState text="Belum ada data" />}
        </div>
      </SectionCard>

      <SectionCard title="Kepanitiaan">
        <div className="flex flex-col gap-3">
          {committee?.length > 0 ? committee.map((c: any) => (
            <div key={c.id} className="flex justify-between items-center p-4 rounded-2xl border border-black/5">
              <div>
                <div className="font-bold text-ink leading-tight">{c.event}</div>
                <div className="text-xs text-ink-3 font-medium">{c.role}</div>
              </div>
              <div className="text-xs font-black text-ink-3">{c.year}</div>
            </div>
          )) : <EmptyState text="Belum ada data" />}
        </div>
      </SectionCard>

      <SectionCard title="Aktivitas Sosial">
        <div className="flex flex-col gap-4">
          {social?.length > 0 ? social.map((s: any) => (
            <div key={s.id} className="p-4 rounded-2xl bg-black/5">
              <div className="font-bold text-ink">{s.activity}</div>
              <div className="text-xs font-bold text-ink-3 mb-2">{s.organization} · {s.role}</div>
              <div className="text-[10px] font-medium text-ink-3 uppercase">{s.start_date} - {s.end_date || 'Sekarang'}</div>
            </div>
          )) : <EmptyState text="Belum ada data" />}
        </div>
      </SectionCard>
    </div>
  );
}

// Helpers
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-[24px] flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-5 bg-hris-red rounded-full"></div>
        <h2 className="text-sm font-black text-ink uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-ink">{value || '-'}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-4 text-center text-xs font-medium text-ink-3 italic">{text}</div>;
}
