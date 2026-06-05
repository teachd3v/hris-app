"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

function FamilyMemberForm({
  prefix,
  index,
  onRemove,
}: {
  prefix: "familyData.coreFamily" | "familyData.extendedFamily";
  index: number;
  onRemove: () => void;
}) {
  const { register } = useFormContext<EmployeeCV>();

  return (
    <div className="relative border border-gray-200 rounded-xl p-5 bg-white/50 space-y-4">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-4 right-4 text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
      >
        ✕
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="field">
          <label>Nama</label>
          <input
            type="text"
            {...register(`${prefix}.${index}.name` as const)}
            placeholder="Nama Lengkap"
          />
        </div>
        <div className="field">
          <label>Tempat Lahir</label>
          <input
            type="text"
            {...register(`${prefix}.${index}.birthPlace` as const)}
            placeholder="Kota/Kabupaten"
          />
        </div>
        <div className="field">
          <label>Tanggal Lahir</label>
          <input
            type="date"
            {...register(`${prefix}.${index}.birthDate` as const)}
          />
        </div>
        <div className="field">
          <label>Jenis Kelamin</label>
          <select {...register(`${prefix}.${index}.gender` as const)}>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div className="field md:col-span-2">
          <label>Pekerjaan / Pendidikan</label>
          <input
            type="text"
            {...register(`${prefix}.${index}.occupationEducation` as const)}
            placeholder="Contoh: Pegawai Swasta / S1 Hukum"
          />
        </div>
      </div>
    </div>
  );
}

export default function FamilyDataSection() {
  const { control } = useFormContext<EmployeeCV>();
  
  const { fields: coreFields, append: appendCore, remove: removeCore } = useFieldArray({
    control,
    name: "familyData.coreFamily",
  });

  const { fields: extendedFields, append: appendExtended, remove: removeExtended } = useFieldArray({
    control,
    name: "familyData.extendedFamily",
  });

  return (
    <FormSection title="2. Data Keluarga" description="Informasi keluarga inti dan keluarga besar">
      <div className="space-y-8">
        {/* Core Family */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-2 uppercase tracking-wider">
              A. KELUARGA INTI (Pasangan, Anak, dst)
            </h3>
            <button
              type="button"
              onClick={() => appendCore({ name: "", birthPlace: "", birthDate: "", gender: "L", occupationEducation: "" })}
              className="btn btn-ghost btn-sm border-dashed"
            >
              + Tambah Anggota
            </button>
          </div>
          
          <div className="grid gap-4">
            {coreFields.map((field, index) => (
              <FamilyMemberForm
                key={field.id}
                prefix="familyData.coreFamily"
                index={index}
                onRemove={() => removeCore(index)}
              />
            ))}
            {coreFields.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                Belum ada data keluarga inti
              </div>
            )}
          </div>
        </div>

        {/* Extended Family */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-2 uppercase tracking-wider">
              B. KELUARGA BESAR (Ayah, Ibu, Kakak, Adik)
            </h3>
            <button
              type="button"
              onClick={() => appendExtended({ name: "", birthPlace: "", birthDate: "", gender: "L", occupationEducation: "" })}
              className="btn btn-ghost btn-sm border-dashed"
            >
              + Tambah Anggota
            </button>
          </div>
          
          <div className="grid gap-4">
            {extendedFields.map((field, index) => (
              <FamilyMemberForm
                key={field.id}
                prefix="familyData.extendedFamily"
                index={index}
                onRemove={() => removeExtended(index)}
              />
            ))}
            {extendedFields.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                Belum ada data keluarga besar
              </div>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
}
