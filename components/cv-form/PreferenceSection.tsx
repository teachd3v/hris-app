"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function PreferenceSection() {
  const { control, register } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "preferences",
  });

  return (
    <FormSection
      title="12. Peminatan"
      description="Bidang atau area yang menjadi minat Anda"
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
              <div className="field md:col-span-2">
                <label>Jenis Peminatan</label>
                <input
                  type="text"
                  {...register(`preferences.${index}.type` as const)}
                  placeholder="Contoh: Digital Marketing, Project Management"
                />
              </div>
              <div className="field md:col-span-2">
                <label>Latar Belakang Peminatan</label>
                <textarea
                  {...register(`preferences.${index}.background` as const)}
                  placeholder="Mengapa Anda meminati bidang ini?"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ type: "", background: "" })}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-600 transition-all font-medium bg-white/30"
        >
          + Tambah Peminatan
        </button>
      </div>
    </FormSection>
  );
}
