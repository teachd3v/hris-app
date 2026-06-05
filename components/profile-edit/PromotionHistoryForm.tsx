"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, SelectField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface Promotion {
  id: string;
  date: string;
  type: string;
  from: string;
  to: string;
}

export interface PromotionHistoryFormValues {
  promotionHistory: Promotion[];
}

interface Props {
  formId: string;
  defaultValues: PromotionHistoryFormValues;
  onSubmit: (values: PromotionHistoryFormValues) => void;
}

const TYPE_OPTIONS = [
  { value: "Promosi", label: "Promosi" },
  { value: "Mutasi", label: "Mutasi" },
  { value: "Demosi", label: "Demosi" },
];

const empty = (): Promotion => ({
  id: crypto.randomUUID(),
  date: "",
  type: "Promosi",
  from: "",
  to: "",
});

export default function PromotionHistoryForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<PromotionHistoryFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "promotionHistory" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Tahun" placeholder="Contoh: 2022" {...register(`promotionHistory.${index}.date`)} />
            <SelectField label="Tipe" options={TYPE_OPTIONS} {...register(`promotionHistory.${index}.type`)} />
            <InputField label="Dari" {...register(`promotionHistory.${index}.from`)} />
            <InputField label="Menjadi" {...register(`promotionHistory.${index}.to`)} />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Riwayat" />
    </form>
  );
}
