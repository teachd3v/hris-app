"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function SocialActivitySection() {
  const { control, register } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialActivities",
  });

  return (
    <FormSection
      title="14. Aktivitas Sosial/Kerelawanan"
      description="Pengalaman dalam aktivitas sosial dan kerelawanan"
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
                <label>Aktivitas</label>
                <input
                  type="text"
                  {...register(`socialActivities.${index}.activity` as const)}
                  placeholder="Nama Kegiatan"
                />
              </div>
              <div className="field">
                <label>Jabatan & Organisasi</label>
                <input
                  type="text"
                  {...register(`socialActivities.${index}.positionOrganization` as const)}
                  placeholder="Contoh: Volunteer @ Dompet Dhuafa"
                />
              </div>
              <div className="field">
                <label>Lokasi / Tingkat</label>
                <input
                  type="text"
                  {...register(`socialActivities.${index}.location` as const)}
                  placeholder="Contoh: Jakarta / Nasional"
                />
              </div>
              <div className="field">
                <label>Tahun</label>
                <input
                  type="text"
                  {...register(`socialActivities.${index}.year` as const)}
                  placeholder="Tahun Pelaksanaan"
                />
              </div>
              <div className="field md:col-span-2">
                <label>Deskripsi Kegiatan</label>
                <textarea
                  {...register(`socialActivities.${index}.description` as const)}
                  placeholder="Ringkasan peran dan dampak kegiatan"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ activity: "", positionOrganization: "", location: "", year: "", description: "" })}
          className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-600 transition-all font-medium bg-white/30"
        >
          + Tambah Aktivitas Sosial
        </button>
      </div>
    </FormSection>
  );
}
