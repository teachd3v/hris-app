"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function WorkExperienceSection() {
  const { register, control } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "workExperience",
  });

  return (
    <FormSection
      title="4. Pengalaman Bekerja"
      description="Riwayat pekerjaan sebelumnya"
    >
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="relative border border-gray-200 rounded-xl p-5 bg-white/50 space-y-4">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label>Nama Perusahaan</label>
                <input
                  type="text"
                  {...register(`workExperience.${index}.companyName` as const)}
                  placeholder="Nama Perusahaan"
                />
              </div>
              <div className="field">
                <label>Jabatan/Posisi</label>
                <input
                  type="text"
                  {...register(`workExperience.${index}.position` as const)}
                  placeholder="Jabatan/Posisi"
                />
              </div>
              <div className="field md:col-span-2">
                <label>Periode Bekerja</label>
                <input
                  type="text"
                  {...register(`workExperience.${index}.workPeriod` as const)}
                  placeholder="Contoh: Jan 2020 - Des 2022"
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
            Belum ada pengalaman kerja
          </div>
        )}

        <button
          type="button"
          onClick={() => append({ companyName: "", position: "", workPeriod: "" })}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
        >
          + Tambah Pengalaman Kerja
        </button>
      </div>
    </FormSection>
  );
}
