"use client";

import React from "react";
import { SDTScores, SDTProfile } from "@/lib/assessment-utils";
import AssessmentCharts from "./AssessmentCharts";

interface AssessmentReportTemplateProps {
  employee: any;
  template: any;
  assessment: any;
  scores: SDTScores;
  persona: SDTProfile;
  profileData: any;
}

export default function AssessmentReportTemplate({
  employee,
  template,
  assessment,
  scores,
  persona,
  profileData,
}: AssessmentReportTemplateProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateDuration = (dateStr: string) => {
    if (!dateStr) return "-";
    const start = new Date(dateStr);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} Tahun`);
    if (months > 0) parts.push(`${months} Bulan`);
    
    return parts.length > 0 ? parts.join(" ") : "Baru Bergabung";
  };

  return (
    <div
      id="pdf-report-template"
      className="p-12 bg-white font-sans"
      style={{ 
        width: '794px', 
        minHeight: '1123px', 
        color: '#15141A', 
        backgroundColor: '#ffffff',
        transition: 'none !important',
        animation: 'none !important'
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '4px solid #15141A', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1" style={{ color: '#15141A' }}>
            Laporan Analisis Individu
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#6B6878' }}>
            {template?.title}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase" style={{ color: '#A6A3B1' }}>Tanggal Laporan</p>
          <p className="text-sm font-black" style={{ color: '#15141A' }}>{formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Employee Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-10" style={{ backgroundColor: '#ffffff' }}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#A6A3B1' }}>Nama Karyawan</label>
            <p className="text-lg font-black" style={{ color: '#15141A' }}>{employee?.name}</p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#A6A3B1' }}>Nomor Induk Karyawan (NIK)</label>
            <p className="text-base font-bold" style={{ color: '#3C3A46' }}>{employee?.employee_code || "-"}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#A6A3B1' }}>Jabatan / Departemen</label>
            <p className="text-base font-bold" style={{ color: '#3C3A46' }}>{employee?.title} / {employee?.dept}</p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#A6A3B1' }}>Status Kepegawaian</label>
            <p className="text-base font-bold" style={{ color: '#3C3A46' }}>{employee?.status || "-"}</p>
          </div>
        </div>
      </div>

      {/* Section I: Data Profil & Rekam Jejak (ATAS) */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: '#15141A' }}></div>
          <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: '#15141A' }}>I. Data Profil & Rekam Jejak Karyawan</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#6B6878' }}>A. Data Personal</h3>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="py-2 w-48 font-bold" style={{ color: '#6B6878' }}>NIK (KTP)</td>
                <td className="py-2 font-bold" style={{ color: '#15141A' }}>{employee?.nik || "-"}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="py-2 font-bold" style={{ color: '#6B6878' }}>Tempat, Tgl Lahir</td>
                <td className="py-2 font-bold" style={{ color: '#15141A' }}>{employee?.birth_date ? formatDate(employee.birth_date) : "-"}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="py-2 font-bold" style={{ color: '#6B6878' }}>Jenis Kelamin</td>
                <td className="py-2 font-bold" style={{ color: '#15141A' }}>{employee?.gender || "-"}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="py-2 font-bold" style={{ color: '#6B6878' }}>Alamat</td>
                <td className="py-2 font-bold" style={{ color: '#15141A' }}>{employee?.address || "-"}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="py-2 font-bold" style={{ color: '#6B6878' }}>Tanggal Bergabung</td>
                <td className="py-2 font-bold" style={{ color: '#15141A' }}>{employee?.join_date ? formatDate(employee.join_date) : "-"}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="py-2 font-bold" style={{ color: '#6B6878' }}>Durasi Bekerja</td>
                <td className="py-2 font-bold" style={{ color: '#15141A' }}>{employee?.join_date ? calculateDuration(employee.join_date) : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#6B6878' }}>B. Riwayat Promosi & Mutasi</h3>
          {profileData?.promotions?.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFB', textAlign: 'left' }}>
                  <th className="p-2 border" style={{ borderColor: '#E2E8F0' }}>Tanggal</th>
                  <th className="p-2 border" style={{ borderColor: '#E2E8F0' }}>Tipe</th>
                  <th className="p-2 border" style={{ borderColor: '#E2E8F0' }}>Dari</th>
                  <th className="p-2 border" style={{ borderColor: '#E2E8F0' }}>Menjadi</th>
                </tr>
              </thead>
              <tbody>
                {profileData.promotions.map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2 border font-medium" style={{ borderColor: '#E2E8F0' }}>{formatDate(p.date)}</td>
                    <td className="p-2 border" style={{ borderColor: '#E2E8F0' }}>{p.type}</td>
                    <td className="p-2 border font-bold" style={{ borderColor: '#E2E8F0' }}>{p.from_position || "-"}</td>
                    <td className="p-2 border font-bold" style={{ borderColor: '#E2E8F0' }}>{p.to_position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm italic" style={{ color: '#A6A3B1' }}>Belum ada data riwayat promosi.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8">
           <div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#6B6878' }}>C. Pelatihan & Sertifikasi</h3>
              {profileData?.trainings?.length > 0 ? (
                <ul className="space-y-2">
                  {profileData.trainings.map((t: any, idx: number) => (
                    <li key={idx} className="p-2 rounded-lg border" style={{ backgroundColor: '#F8FAFB', borderColor: '#E2E8F0' }}>
                      <p className="text-xs font-black" style={{ color: '#15141A' }}>{t.name}</p>
                      <p className="text-[9px] font-bold" style={{ color: '#6B6878' }}>{t.provider} | {formatDate(t.date)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic" style={{ color: '#A6A3B1' }}>Belum ada data pelatihan.</p>
              )}
           </div>
           <div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#6B6878' }}>D. Keahlian & Kemampuan</h3>
              {profileData?.skills?.length > 0 ? (
                <ul className="space-y-1">
                  {profileData.skills.map((s: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-center p-2 rounded-lg border" style={{ backgroundColor: '#F8FAFB', borderColor: '#F1F5F9' }}>
                      <span className="text-sm font-bold" style={{ color: '#15141A' }}>{s.name}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E2E8F0', color: '#15141A' }}>{s.proficiency}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic" style={{ color: '#A6A3B1' }}>Belum ada data keahlian.</p>
              )}
           </div>
        </div>
      </div>

      {/* Section II: Profil Motivasi (SDT) (TENGAH) */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: '#15141A' }}></div>
          <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: '#15141A' }}>II. Profil Motivasi (Self-Determination Theory)</h2>
        </div>
        {/* Radar Chart Display */}
        <div className="mb-8 flex justify-center p-8 rounded-[40px] border" style={{ backgroundColor: '#F8FAFB', borderColor: '#E2E8F0' }}>
           <div className="w-[450px]">
              <AssessmentCharts assessments={[assessment]} isPrintMode={true} />
           </div>
        </div>


        <div className="rounded-[32px] p-8 border" style={{ backgroundColor: '#F8FAFB', borderColor: '#E2E8F0' }}>
          <div className="flex gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{persona?.icon}</span>
                <div>
                  <p className="text-[10px] font-black uppercase" style={{ color: '#6B6878' }}>Persona Motivasi</p>
                  <h3 className="text-2xl font-black" style={{ color: '#15141A' }}>{persona?.label}</h3>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tighter" style={{ color: '#6B6878' }}>Indikator Dominan</p>
                  <p className="text-sm font-bold" style={{ color: '#15141A' }}>{persona?.indicators}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tighter" style={{ color: '#6B6878' }}>Analisis Psikologis Komprehensif</p>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: '#3C3A46', textAlign: 'left' }}>
                    {persona?.explanation}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-48 p-4 rounded-2xl border shadow-sm shrink-0" style={{ backgroundColor: '#ffffff', borderColor: '#F1F5F9' }}>
               <p className="text-[9px] font-black uppercase text-center mb-3" style={{ color: '#A6A3B1' }}>Skor Payung</p>
               <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase" style={{ color: '#16A34A' }}>Otonom</p>
                    <p className="text-2xl font-black" style={{ color: '#15141A' }}>{scores?.autonomous.toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase" style={{ color: '#DC2626' }}>Terkontrol</p>
                    <p className="text-2xl font-black" style={{ color: '#15141A' }}>{scores?.controlled.toFixed(1)}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t" style={{ borderTopColor: '#E2E8F0' }}>
             <p className="text-xs font-black uppercase mb-3" style={{ color: '#6B6878' }}>💡 Strategi Rekomendasi HR (Treatment)</p>
             <div className="p-5 rounded-2xl text-sm font-bold leading-relaxed border" style={{ backgroundColor: '#ffffff', borderColor: '#F1F5F9', color: '#15141A' }}>
               {persona?.treatment}
             </div>
          </div>
        </div>
      </div>

      {/* Section III: Refleksi & Umpan Balik Kualitatif (BAWAH) */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-6 rounded-full" style={{ backgroundColor: '#15141A' }}></div>
          <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: '#15141A' }}>III. Refleksi & Umpan Balik Kualitatif</h2>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const q = template?.schema.find((item: any) => item.id === `c${i}`);
            const ans = assessment?.answers[`c${i}`];
            if (!q || !ans) return null;
            return (
              <div key={i} className="border-b pb-4 last:border-0" style={{ borderBottomColor: '#F1F5F9' }}>
                <p className="text-[10px] font-black uppercase mb-1" style={{ color: '#6B6878' }}>{q.question}</p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: '#15141A' }}>{ans}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t text-center" style={{ borderTopColor: '#E2E8F0' }}>
        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#A6A3B1' }}>
          TEACH HRIS REPORT SYSTEM
        </p>
      </div>
    </div>
  );
}
