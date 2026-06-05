"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, SelectField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface Skill {
  id: string;
  name: string;
  proficiency: string;
}

export interface SkillsFormValues {
  skills: Skill[];
}

interface Props {
  formId: string;
  defaultValues: SkillsFormValues;
  onSubmit: (values: SkillsFormValues) => void;
}

const PROFICIENCY_OPTIONS = [
  { value: "Expert", label: "Expert" },
  { value: "Advanced", label: "Advanced" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Beginner", label: "Beginner" },
];

const empty = (): Skill => ({
  id: crypto.randomUUID(),
  name: "",
  proficiency: "Intermediate",
});

export default function SkillsForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<SkillsFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "skills" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Skill / Keahlian" {...register(`skills.${index}.name`)} />
            <SelectField
              label="Tingkat"
              options={PROFICIENCY_OPTIONS}
              {...register(`skills.${index}.proficiency`)}
            />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Skill" />
    </form>
  );
}
