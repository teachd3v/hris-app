"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, TextareaField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface Achievement {
  id: string;
  title: string;
  level: string;
  date: string;
  description: string;
}

export interface AchievementsFormValues {
  achievements: Achievement[];
}

interface Props {
  formId: string;
  defaultValues: AchievementsFormValues;
  onSubmit: (values: AchievementsFormValues) => void;
}

const empty = (): Achievement => ({
  id: crypto.randomUUID(),
  title: "",
  level: "",
  date: "",
  description: "",
});

export default function AchievementsForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<AchievementsFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "achievements" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Judul" {...register(`achievements.${index}.title`)} />
            <InputField label="Tingkat" placeholder="Contoh: Nasional" {...register(`achievements.${index}.level`)} />
            <InputField label="Tahun" placeholder="Contoh: 2022" {...register(`achievements.${index}.date`)} />
            <div />
            <div className="md:col-span-2">
              <TextareaField label="Deskripsi" rows={2} {...register(`achievements.${index}.description`)} />
            </div>
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Prestasi" />
    </form>
  );
}
