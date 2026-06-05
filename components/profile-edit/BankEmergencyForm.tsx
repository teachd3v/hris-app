"use client";

import { useForm } from "react-hook-form";
import { InputField } from "./fields";

export interface BankEmergencyFormValues {
  bank: string;
}

interface Props {
  formId: string;
  defaultValues: BankEmergencyFormValues;
  onSubmit: (values: BankEmergencyFormValues) => void;
}

export default function BankEmergencyForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, handleSubmit } = useForm<BankEmergencyFormValues>({ defaultValues });
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <InputField
        label="Rekening Bank"
        placeholder="Contoh: BSI - 7712127129"
        {...register("bank")}
      />
    </form>
  );
}
