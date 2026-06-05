"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface SocialActivity {
  id: string;
  activity: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
}

export interface SocialActivitiesFormValues {
  socialActivities: SocialActivity[];
}

interface Props {
  formId: string;
  defaultValues: SocialActivitiesFormValues;
  onSubmit: (values: SocialActivitiesFormValues) => void;
}

const empty = (): SocialActivity => ({
  id: crypto.randomUUID(),
  activity: "",
  organization: "",
  role: "",
  startDate: "",
  endDate: "",
});

export default function SocialActivitiesForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<SocialActivitiesFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "socialActivities" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Aktivitas" {...register(`socialActivities.${index}.activity`)} />
            <InputField label="Organisasi" {...register(`socialActivities.${index}.organization`)} />
            <InputField label="Peran" {...register(`socialActivities.${index}.role`)} />
            <div />
            <InputField label="Tahun Mulai" placeholder="Contoh: 2021" {...register(`socialActivities.${index}.startDate`)} />
            <InputField
              label="Tahun Selesai (kosongkan = sekarang)"
              placeholder="Contoh: 2023"
              {...register(`socialActivities.${index}.endDate`)}
            />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Aktivitas Sosial" />
    </form>
  );
}
