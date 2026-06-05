"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface NonFormalEducation {
  id: string;
  name: string;
  institution: string;
  year: string;
}

export interface NonFormalEducationFormValues {
  nonFormalEducation: NonFormalEducation[];
}

interface Props {
  formId: string;
  defaultValues: NonFormalEducationFormValues;
  onSubmit: (values: NonFormalEducationFormValues) => void;
}

const empty = (): NonFormalEducation => ({
  id: crypto.randomUUID(),
  name: "",
  institution: "",
  year: "",
});

export default function NonFormalEducationForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<NonFormalEducationFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "nonFormalEducation" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Nama Pelatihan/Kursus" {...register(`nonFormalEducation.${index}.name`)} />
            <InputField label="Institusi" {...register(`nonFormalEducation.${index}.institution`)} />
            <InputField label="Tahun" {...register(`nonFormalEducation.${index}.year`)} />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Pendidikan Non-Formal" />
    </form>
  );
}
