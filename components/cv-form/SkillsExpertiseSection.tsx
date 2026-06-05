"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function SkillsExpertiseSection() {
  const { register, control } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  return (
    <FormSection
      title="10. Keterampilan/Keahlian yang Dimiliki"
      description="Daftar keterampilan dan keahlian Anda"
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
                <label>Jenis Keahlian</label>
                <input
                  type="text"
                  {...register(`skills.${index}.skillType` as const)}
                  placeholder="Jenis Keahlian"
                />
              </div>
              <div className="field">
                <label>Tingkat</label>
                <select {...register(`skills.${index}.level` as const)}>
                  <option value="BASIC">Basic</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCE">Advance</option>
                </select>
              </div>
              <div className="field md:col-span-2">
                <label>Deskripsi</label>
                <textarea
                  {...register(`skills.${index}.description` as const)}
                  placeholder="Deskripsi"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
            Belum ada keterampilan
          </div>
        )}

        <button
          type="button"
          onClick={() => append({ skillType: "", description: "", level: "BASIC" })}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
        >
          + Tambah Keterampilan
        </button>
      </div>
    </FormSection>
  );
}
