"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function LanguageSkillsSection() {
  const { register, control } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "languageSkills",
  });

  return (
    <FormSection
      title="9. Kemampuan Bahasa"
      description="Bahasa yang dapat Anda gunakan dan tingkat kemampuannya"
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
                <label>Jenis Kemampuan</label>
                <select {...register(`languageSkills.${index}.skillType` as const)}>
                  <option value="Mendengar">Mendengar</option>
                  <option value="Berbicara">Berbicara</option>
                  <option value="Membaca">Membaca</option>
                  <option value="Menulis">Menulis</option>
                </select>
              </div>
              <div className="field">
                <label>Bahasa</label>
                <input
                  type="text"
                  {...register(`languageSkills.${index}.language` as const)}
                  placeholder="Inggris, Arab, Jepang, dst"
                />
              </div>
              <div className="field">
                <label>Tingkat Kemampuan</label>
                <input
                  type="text"
                  {...register(`languageSkills.${index}.proficiency` as const)}
                  placeholder="Tingkat Kemampuan"
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
            Belum ada kemampuan bahasa
          </div>
        )}

        <button
          type="button"
          onClick={() => append({ skillType: "Mendengar", language: "", proficiency: "" })}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
        >
          + Tambah Kemampuan Bahasa
        </button>
      </div>
    </FormSection>
  );
}
