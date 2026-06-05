"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface CommitteeExperience {
  id: string;
  event: string;
  role: string;
  year: string;
}

export interface CommitteeExperienceFormValues {
  committeeExperience: CommitteeExperience[];
}

interface Props {
  formId: string;
  defaultValues: CommitteeExperienceFormValues;
  onSubmit: (values: CommitteeExperienceFormValues) => void;
}

const empty = (): CommitteeExperience => ({
  id: crypto.randomUUID(),
  event: "",
  role: "",
  year: "",
});

export default function CommitteeExperienceForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<CommitteeExperienceFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "committeeExperience" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Nama Acara/Event" placeholder="Contoh: Ramadan Bersama" {...register(`committeeExperience.${index}.event`)} />
            <InputField label="Peran/Posisi" placeholder="Contoh: Ketua Pelaksana" {...register(`committeeExperience.${index}.role`)} />
            <div className="md:col-span-2">
              <InputField
                label="Tahun"
                placeholder="Contoh: 2025"
                {...register(`committeeExperience.${index}.year`)}
              />
            </div>
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Kepanitiaan" />
    </form>
  );
}
