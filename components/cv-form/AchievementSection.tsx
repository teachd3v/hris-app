"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function AchievementSection() {
  const { control, register } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "achievements",
  });

  return (
    <FormSection
      title="15. Prestasi yang Pernah Diraih"
      description="Penghargaan dan prestasi yang telah Anda raih"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="field">
                <label>Prestasi</label>
                <input
                  type="text"
                  {...register(`achievements.${index}.achievement` as const)}
                  placeholder="Judul Penghargaan"
                />
              </div>
              <div className="field">
                <label>Tingkat</label>
                <input
                  type="text"
                  {...register(`achievements.${index}.tier` as const)}
                  placeholder="Contoh: Nasional / Internasional"
                />
              </div>
              <div className="field">
                <label>Tahun</label>
                <input
                  type="text"
                  {...register(`achievements.${index}.year` as const)}
                  placeholder="Tahun Perolehan"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ achievement: "", tier: "", year: "" })}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-600 transition-all font-medium bg-white/30"
        >
          + Tambah Prestasi
        </button>
      </div>
    </FormSection>
  );
}
