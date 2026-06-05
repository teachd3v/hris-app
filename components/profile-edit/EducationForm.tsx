"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, SelectField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface Education {
  id: string;
  institution: string;
  level: string;
  field: string;
  year: string;
}

export interface EducationFormValues {
  education: Education[];
}

interface Props {
  formId: string;
  defaultValues: EducationFormValues;
  onSubmit: (values: EducationFormValues) => void;
}

const LEVEL_OPTIONS = [
  { value: "D3", label: "D3" },
  { value: "D4", label: "D4" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
];

const empty = (): Education => ({
  id: crypto.randomUUID(),
  institution: "",
  level: "",
  field: "",
  year: "",
});

export default function EducationForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<EducationFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "education" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Institusi" {...register(`education.${index}.institution`)} />
            <SelectField
              label="Jenjang"
              placeholder="Pilih jenjang"
              options={LEVEL_OPTIONS}
              {...register(`education.${index}.level`)}
            />
            <InputField label="Bidang Studi" {...register(`education.${index}.field`)} />
            <InputField label="Tahun Lulus" {...register(`education.${index}.year`)} />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Pendidikan" />
    </form>
  );
}
