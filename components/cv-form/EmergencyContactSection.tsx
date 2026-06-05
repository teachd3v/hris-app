"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function EmergencyContactSection() {
  const { register, control } = useFormContext<EmployeeCV>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "emergencyContact",
  });

  return (
    <FormSection
      title="3. Keluarga Terdekat yang Dapat Dihubungi"
      description="Kontak darurat untuk keluarga terdekat"
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
                <label>Nama</label>
                <input
                  type="text"
                  {...register(`emergencyContact.${index}.name` as const)}
                  placeholder="Nama"
                />
              </div>
              <div className="field">
                <label>Hubungan</label>
                <input
                  type="text"
                  {...register(`emergencyContact.${index}.relationship` as const)}
                  placeholder="Suami, Istri, Kakak, Orang Tua, dst"
                />
              </div>
              <div className="field md:col-span-2">
                <label>Alamat</label>
                <textarea
                  {...register(`emergencyContact.${index}.address` as const)}
                  placeholder="Alamat"
                  rows={2}
                />
              </div>
              <div className="field md:col-span-2">
                <label>No. Tlp/HP</label>
                <input
                  type="tel"
                  {...register(`emergencyContact.${index}.phoneNumber` as const)}
                  placeholder="No. Tlp/HP"
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
            Belum ada kontak darurat
          </div>
        )}

        <button
          type="button"
          onClick={() => append({ name: "", relationship: "", address: "", phoneNumber: "" })}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-600 transition-colors font-medium"
        >
          + Tambah Kontak Darurat
        </button>
      </div>
    </FormSection>
  );
}
