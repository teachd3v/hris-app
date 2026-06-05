"use client";

import { useFormContext } from "react-hook-form";
import FormSection from "@/components/common/FormSection";
import { EmployeeCV } from "@/types/employee";

export default function EmploymentStatusSection() {
  const { register } = useFormContext<EmployeeCV>();

  return (
    <FormSection
      title="5. Status di Kerja"
      description="Informasi status kepegawaian Anda"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="field">
          <label>Tanggal Bergabung</label>
          <input
            type="date"
            {...register("employmentStatus.joinDate" as const)}
          />
        </div>
        <div className="field">
          <label>Tanggal Menjadi Karyawan Tetap</label>
          <input
            type="date"
            {...register("employmentStatus.permanentDate" as const)}
          />
        </div>
        <div className="field">
          <label>Jabatan saat Pengangkatan Tetap</label>
          <input
            type="text"
            {...register("employmentStatus.permanentPosition" as const)}
          />
        </div>
        <div className="field">
          <label>Jabatan saat ini</label>
          <input
            type="text"
            {...register("employmentStatus.currentPosition" as const)}
          />
        </div>
      </div>
    </FormSection>
  );
}
