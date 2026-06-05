"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface Training {
  id: string;
  name: string;
  provider: string;
  date: string;
}

export interface TrainingFormValues {
  training: Training[];
}

interface Props {
  formId: string;
  defaultValues: TrainingFormValues;
  onSubmit: (values: TrainingFormValues) => void;
}

const empty = (): Training => ({
  id: crypto.randomUUID(),
  name: "",
  provider: "",
  date: "",
});

export default function TrainingForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<TrainingFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "training" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Nama Training" {...register(`training.${index}.name`)} />
            <InputField label="Provider" {...register(`training.${index}.provider`)} />
            <InputField label="Tahun" placeholder="Contoh: 2023" {...register(`training.${index}.date`)} />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Training" />
    </form>
  );
}
