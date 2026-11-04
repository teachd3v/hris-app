"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { InputField, SelectField } from "./fields";
import { DEPT_OPTIONS, LEVEL_OPTIONS, STATUS_OPTIONS } from "@/lib/employment-options";

export interface EmploymentInfoFormValues {
  employeeCode: string;
  title: string;
  dept: string;
  level: string;
  status: string;
  join: string;
  tenure: string;
  manager: string;
}

interface Props {
  formId: string;
  defaultValues: EmploymentInfoFormValues;
  onSubmit: (values: EmploymentInfoFormValues) => void;
}

export default function EmploymentInfoForm({ formId, defaultValues, onSubmit }: Props) {
  const { register, handleSubmit, watch, setValue } = useForm<EmploymentInfoFormValues>({ defaultValues });
  const joinDate = watch("join");

  useEffect(() => {
    if (joinDate) {
      const start = new Date(joinDate);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      const parts = [];
      if (years > 0) parts.push(`${years} Tahun`);
      if (months > 0) parts.push(`${months} Bulan`);
      setValue("tenure", parts.length > 0 ? parts.join(" ") : "Kurang dari 1 bulan", { shouldDirty: true });
    } else {
      setValue("tenure", "", { shouldDirty: true });
    }
  }, [joinDate, setValue]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField label="Nomor Induk Karyawan" {...register("employeeCode")} />
      <InputField label="Jabatan" {...register("title")} />
      <SelectField label="Departemen" options={DEPT_OPTIONS} {...register("dept")} />
      <SelectField label="Level" options={LEVEL_OPTIONS} {...register("level")} />
      <SelectField label="Status" options={STATUS_OPTIONS} {...register("status")} />
      <InputField label="Tanggal Masuk" type="date" {...register("join")} />
      <InputField label="Masa Kerja (Terisi Otomatis)" placeholder="Dihitung otomatis dari Tanggal Masuk" disabled {...register("tenure")} />
      <div className="md:col-span-2">
        <InputField label="Atasan Langsung (diatur oleh HC)" disabled {...register("manager")} />
      </div>
    </form>
  );
}
