"use client";

import { useState } from "react";
import CVForm from "@/components/cv-form/CVForm";
import CVPreview from "@/components/cv-preview/CVPreview";
import { EmployeeCV } from "@/types/employee";

export default function CVUpdatePage() {
  const [submittedCV, setSubmittedCV] = useState<EmployeeCV | null>(null);

  const handleSubmit = (cv: EmployeeCV) => {
    setSubmittedCV(cv);
  };

  const handleEdit = () => {
    setSubmittedCV(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {submittedCV ? (
          <CVPreview cv={submittedCV} onEdit={handleEdit} />
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Update CV Karyawan</h1>
              <p className="text-gray-600 mt-2">
                Mohon isi semua informasi berikut dengan data yang akurat dan lengkap
              </p>
            </div>
            <CVForm onSubmit={handleSubmit} />
          </div>
        )}
      </div>
    </div>
  );
}
