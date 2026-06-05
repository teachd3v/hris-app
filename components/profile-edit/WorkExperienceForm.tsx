"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, TextareaField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface WorkExperienceFormValues {
  workExperience: WorkExperience[];
}

interface Props {
  formId: string;
  defaultValues: WorkExperienceFormValues;
  onSubmit: (values: WorkExperienceFormValues) => void;
}

const empty = (): WorkExperience => ({
  id: crypto.randomUUID(),
  company: "",
  position: "",
  startDate: "",
  endDate: "",
  description: "",
});

export default function WorkExperienceForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<WorkExperienceFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "workExperience" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Perusahaan" {...register(`workExperience.${index}.company`)} />
            <InputField label="Posisi" {...register(`workExperience.${index}.position`)} />
            <InputField label="Tahun Mulai" placeholder="Contoh: 2018" {...register(`workExperience.${index}.startDate`)} />
            <InputField
              label="Tahun Selesai (kosongkan = sekarang)"
              placeholder="Contoh: 2021"
              {...register(`workExperience.${index}.endDate`)}
            />
            <div className="md:col-span-2">
              <TextareaField label="Deskripsi" rows={2} {...register(`workExperience.${index}.description`)} />
            </div>
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Pengalaman Kerja" />
    </form>
  );
}
