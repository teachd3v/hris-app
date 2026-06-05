"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function TrainingExperienceSection() {
  const { control, register } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "trainingExperience",
  });

  return (
    <FormSection
      title="11. Pengalaman Mengisi Training"
      description="Pengalaman dan level dalam training yang diikuti"
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
                <label>Materi</label>
                <input
                  type="text"
                  {...register(`trainingExperience.${index}.material` as const)}
                  placeholder="Nama Materi Training"
                />
              </div>
              <div className="field">
                <label>Level</label>
                <select {...register(`trainingExperience.${index}.level` as const)}>
                  <option value="BASIC">Basic</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCE">Advance</option>
                </select>
              </div>
              <div className="field md:col-span-2">
                <label>Deskripsi</label>
                <textarea
                  {...register(`trainingExperience.${index}.description` as const)}
                  placeholder="Penjelasan singkat mengenai training"
                  rows={2}
                />
              </div>
              <div className="field md:col-span-2">
                <label>Tingkat / Tier</label>
                <select {...register(`trainingExperience.${index}.tier` as const)}>
                  <option value="INTERNAL DD NET">Internal DD NET</option>
                  <option value="KABUPATEN/KOTA">Kabupaten/Kota</option>
                  <option value="PROVINSI">Provinsi</option>
                  <option value="NASIONAL">Nasional</option>
                  <option value="INTERNASIONAL">Internasional</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ material: "", description: "", level: "BASIC", tier: "INTERNAL DD NET" })}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-600 transition-all font-medium bg-white/30"
        >
          + Tambah Pengalaman Training
        </button>
      </div>
    </FormSection>
  );
}
