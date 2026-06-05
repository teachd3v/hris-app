"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function NonFormalEducationSection() {
  const { register, control, setValue } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "nonFormalEducation",
  });

  return (
    <FormSection
      title="8. Pendidikan Non Formal"
      description="Training, seminar, sertifikasi, dan pelatihan lainnya"
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
                <label>Nama Pelatihan/Seminar</label>
                <input
                  type="text"
                  {...register(`nonFormalEducation.${index}.trainingName` as const)}
                  placeholder="Nama Pelatihan/Seminar/Training/Sertifikasi"
                />
              </div>
              <div className="field">
                <label>Fasilitator/Lembaga</label>
                <input
                  type="text"
                  {...register(`nonFormalEducation.${index}.institution` as const)}
                  placeholder="Fasilitator/Lembaga Penyelenggara"
                />
              </div>
              <div className="field">
                <label>Waktu Pelaksanaan</label>
                <input
                  type="date"
                  {...register(`nonFormalEducation.${index}.executionDate` as const)}
                />
              </div>
              <div className="field">
                <label>File Sertifikat (opsional)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setValue(`nonFormalEducation.${index}.certificateFile`, e.target.files[0]);
                    }
                  }}
                />
              </div>
              <div className="field">
                <label>File Materi (opsional)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setValue(`nonFormalEducation.${index}.materialFile`, e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
            Belum ada pendidikan non formal
          </div>
        )}

        <button
          type="button"
          onClick={() => append({ trainingName: "", institution: "", executionDate: "" })}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
        >
          + Tambah Pendidikan Non Formal
        </button>
      </div>
    </FormSection>
  );
}
