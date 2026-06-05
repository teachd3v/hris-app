"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { InputField, TextareaField } from "./fields";
import { ArrayItemCard, AddItemButton } from "./ArrayItemCard";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface EmergencyContactsFormValues {
  emergencyContacts: EmergencyContact[];
}

interface Props {
  formId: string;
  defaultValues: EmergencyContactsFormValues;
  onSubmit: (values: EmergencyContactsFormValues) => void;
}

const empty = (): EmergencyContact => ({
  id: crypto.randomUUID(),
  name: "",
  relationship: "",
  phone: "",
  address: "",
});

export default function EmergencyContactsForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, control, handleSubmit } = useForm<EmergencyContactsFormValues>({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: "emergencyContacts" });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      {fields.map((field, index) => (
        <ArrayItemCard key={field.id} onRemove={() => remove(index)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Nama" {...register(`emergencyContacts.${index}.name`)} />
            <InputField label="Hubungan" {...register(`emergencyContacts.${index}.relationship`)} />
            <InputField label="Telepon" type="tel" {...register(`emergencyContacts.${index}.phone`)} />
            <div className="md:col-span-2">
              <TextareaField label="Alamat" rows={2} {...register(`emergencyContacts.${index}.address`)} />
            </div>
          </div>
        </ArrayItemCard>
      ))}
      <AddItemButton onClick={() => append(empty())} label="Tambah Kontak Darurat" />
    </form>
  );
}
