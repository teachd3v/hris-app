"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface OrgExperience {
  id: string;
  organization: string;
  role: string;
  period: string;
}

export interface OrgExperienceFormValues {
  orgExperience: OrgExperience[];
}

interface Props {
  formId: string;
  defaultValues: OrgExperienceFormValues;
  onSubmit: (values: OrgExperienceFormValues) => void;
}

const empty = (): OrgExperience => ({
  id: crypto.randomUUID(),
  organization: "",
  role: "",
  period: "",
});

export default function OrgExperienceForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<OrgExperienceFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "orgExperience" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Organisasi" {...register(`orgExperience.${index}.organization`)} />
            <InputField label="Peran" {...register(`orgExperience.${index}.role`)} />
            <div className="md:col-span-2">
              <InputField
                label="Periode"
                placeholder="Contoh: 2019-sekarang"
                {...register(`orgExperience.${index}.period`)}
              />
            </div>
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Organisasi" />
    </form>
  );
}
