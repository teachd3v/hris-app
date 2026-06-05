"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface CareerInterest {
  id: string;
  position: string;
  department: string;
}

export interface CareerInterestsFormValues {
  careerInterests: CareerInterest[];
}

interface Props {
  formId: string;
  defaultValues: CareerInterestsFormValues;
  onSubmit: (values: CareerInterestsFormValues) => void;
}

const empty = (): CareerInterest => ({
  id: crypto.randomUUID(),
  position: "",
  department: "",
});

export default function CareerInterestsForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<CareerInterestsFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "careerInterests" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Posisi" {...register(`careerInterests.${index}.position`)} />
            <InputField label="Departemen" {...register(`careerInterests.${index}.department`)} />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Peminatan" />
    </form>
  );
}
