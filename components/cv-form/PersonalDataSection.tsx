"use client";

import { useFormContext } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function PersonalDataSection() {
  const { register, setValue, watch } = useFormContext<EmployeeCV>();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setValue("personalData.photo", e.target.files[0]);
    }
  };

  return (
    <FormSection title="1. Data Personal" description="Informasi data pribadi Anda">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foto Terbaru
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap *
          </label>
          <input
            type="text"
            {...register("personalData.fullName", { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tempat Lahir
          </label>
          <input
            type="text"
            {...register("personalData.birthPlace")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Lahir
          </label>
          <input
            type="date"
            {...register("personalData.birthDate")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Suku</label>
          <input
            type="text"
            {...register("personalData.ethnicity")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Kelamin
          </label>
          <select
            {...register("personalData.gender")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">Pilih Jenis Kelamin</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Golongan Darah
          </label>
          <select
            {...register("personalData.bloodType")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">Pilih Golongan Darah</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hobi</label>
          <input
            type="text"
            {...register("personalData.hobby")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status Pernikahan
          </label>
          <select
            {...register("personalData.maritalStatus")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">Pilih Status</option>
            <option value="Belum Menikah">Belum Menikah</option>
            <option value="Menikah">Menikah</option>
            <option value="Cerai">Cerai</option>
            <option value="Duda/Janda">Duda/Janda</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Pernikahan
          </label>
          <input
            type="date"
            {...register("personalData.marriageDate")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. Tlp Rumah
          </label>
          <input
            type="tel"
            {...register("personalData.homePhone")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. Hp Pribadi *
          </label>
          <input
            type="tel"
            {...register("personalData.personalPhone", { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. Hp Suami/Istri
          </label>
          <input
            type="tel"
            {...register("personalData.spousePhone")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat Email Resmi Lembaga *
          </label>
          <input
            type="email"
            {...register("personalData.officialEmail", { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat Email Lainnya
          </label>
          <input
            type="email"
            {...register("personalData.otherEmail")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. KTP *
          </label>
          <input
            type="text"
            {...register("personalData.ktpNumber", { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Masa Berlaku KTP
          </label>
          <input
            type="date"
            {...register("personalData.ktpExpiry")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. SIM C
          </label>
          <input
            type="text"
            {...register("personalData.simCNumber")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Masa Berlaku SIM
          </label>
          <input
            type="date"
            {...register("personalData.simCExpiry")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            No. NPWP
          </label>
          <input
            type="text"
            {...register("personalData.npwpNumber")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Media Sosial
          </label>
          <input
            type="text"
            {...register("personalData.socialMedia")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
            placeholder="Contoh: @username atau link profil"
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat Sesuai Dengan KTP *
          </label>
          <textarea
            {...register("personalData.ktpAddress", { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat Tinggal Sekarang *
          </label>
          <textarea
            {...register("personalData.currentAddress", { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
            rows={3}
          />
        </div>
      </div>
    </FormSection>
  );
}
