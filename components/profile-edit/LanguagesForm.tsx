"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, SelectField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface Language {
  id: string;
  name: string;
  proficiency: string;
}

export interface LanguagesFormValues {
  languages: Language[];
}

interface Props {
  formId: string;
  defaultValues: LanguagesFormValues;
  onSubmit: (values: LanguagesFormValues) => void;
}

const PROFICIENCY_OPTIONS = [
  { value: "Native", label: "Native" },
  { value: "Fluent", label: "Fluent" },
  { value: "Advanced", label: "Advanced" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Basic", label: "Basic" },
];

const empty = (): Language => ({
  id: crypto.randomUUID(),
  name: "",
  proficiency: "Basic",
});

export default function LanguagesForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<LanguagesFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "languages" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Bahasa" {...register(`languages.${index}.name`)} />
            <SelectField
              label="Kemampuan"
              options={PROFICIENCY_OPTIONS}
              {...register(`languages.${index}.proficiency`)}
            />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Bahasa" />
    </form>
  );
}
