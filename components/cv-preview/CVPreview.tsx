"use client";

import { EmployeeCV } from "@/types/employee";

interface CVPreviewProps {
  cv: EmployeeCV;
  onEdit: () => void;
}

export default function CVPreview({ cv, onEdit }: CVPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{cv.personalData.fullName}</h1>
          <p className="text-lg text-gray-600 mt-2">{cv.employmentStatus.currentPosition}</p>
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <p>📧 {cv.personalData.officialEmail}</p>
            <p>📱 {cv.personalData.personalPhone}</p>
            <p>📍 {cv.personalData.currentAddress}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Edit CV
        </button>
      </div>

      <div className="border-t-2 pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Pribadi</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-700">Tempat Lahir</p>
            <p className="text-gray-600">{cv.personalData.birthPlace}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Tanggal Lahir</p>
            <p className="text-gray-600">{cv.personalData.birthDate}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Jenis Kelamin</p>
            <p className="text-gray-600">{cv.personalData.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Status Pernikahan</p>
            <p className="text-gray-600">{cv.personalData.maritalStatus}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">No. KTP</p>
            <p className="text-gray-600">{cv.personalData.ktpNumber}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">No. HP Pribadi</p>
            <p className="text-gray-600">{cv.personalData.personalPhone}</p>
          </div>
        </div>
      </div>

      {cv.workExperience.length > 0 && (
        <div className="border-t-2 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pengalaman Kerja</h2>
          <div className="space-y-4">
            {cv.workExperience.map((exp, idx) => (
              <div key={idx} className="pl-4 border-l-4 border-blue-500">
                <p className="font-semibold text-gray-900">{exp.position}</p>
                <p className="text-gray-600">{exp.companyName}</p>
                <p className="text-sm text-gray-500">{exp.workPeriod}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {cv.education.length > 0 && (
        <div className="border-t-2 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Riwayat Pendidikan</h2>
          <div className="space-y-4">
            {cv.education.map((edu, idx) => (
              <div key={idx} className="pl-4 border-l-4 border-green-500">
                <p className="font-semibold text-gray-900">{edu.level} - {edu.major}</p>
                <p className="text-gray-600">{edu.schoolName}</p>
                <p className="text-sm text-gray-500">Tahun {edu.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {cv.skills.length > 0 && (
        <div className="border-t-2 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Keterampilan</h2>
          <div className="space-y-2">
            {cv.skills.map((skill, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{skill.skillType}</p>
                  <p className="text-sm text-gray-600">{skill.description}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {skill.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cv.languageSkills.length > 0 && (
        <div className="border-t-2 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kemampuan Bahasa</h2>
          <div className="space-y-2">
            {cv.languageSkills.map((lang, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{lang.language}</p>
                  <p className="text-sm text-gray-600">{lang.skillType}</p>
                </div>
                <span className="text-gray-700 font-medium">{lang.proficiency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cv.achievements.length > 0 && (
        <div className="border-t-2 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Prestasi</h2>
          <div className="space-y-2">
            {cv.achievements.map((achievement, idx) => (
              <div key={idx} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <p className="font-semibold text-gray-900">🏆 {achievement.achievement}</p>
                <p className="text-sm text-gray-600">{achievement.tier} • {achievement.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t-2 pt-6 text-center text-sm text-gray-500">
        <p>CV terakhir diperbarui: {new Date(cv.updatedAt).toLocaleDateString("id-ID")}</p>
      </div>
    </div>
  );
}
