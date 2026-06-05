"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, SelectField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface FamilyMember {
  id: string;
  relationship: string;
  name: string;
  birthDate: string;
  occupation: string;
  phone: string;
}

export interface FamilyFormValues {
  family: FamilyMember[];
}

interface Props {
  formId: string;
  defaultValues: FamilyFormValues;
  onSubmit: (values: FamilyFormValues) => void;
}

const RELATIONSHIP_OPTIONS = [
  { value: "Istri", label: "Istri" },
  { value: "Suami", label: "Suami" },
  { value: "Anak", label: "Anak" },
  { value: "Orang Tua", label: "Orang Tua" },
  { value: "Saudara", label: "Saudara" },
  { value: "Lainnya", label: "Lainnya" },
];

const empty = (): FamilyMember => ({
  id: crypto.randomUUID(),
  relationship: "",
  name: "",
  birthDate: "",
  occupation: "",
  phone: "",
});

export default function FamilyForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<FamilyFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "family" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Nama" {...register(`family.${index}.name`)} />
            <SelectField
              label="Hubungan"
              placeholder="Pilih hubungan"
              options={RELATIONSHIP_OPTIONS}
              {...register(`family.${index}.relationship`)}
            />
            <InputField label="Tanggal Lahir" type="date" {...register(`family.${index}.birthDate`)} />
            <InputField label="Pekerjaan" {...register(`family.${index}.occupation`)} />
            <InputField label="Telepon" type="tel" {...register(`family.${index}.phone`)} />
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Anggota Keluarga" />
    </form>
  );
}
