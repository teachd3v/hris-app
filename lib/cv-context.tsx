"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { EmployeeCV, PersonalData } from "@/types/employee";

interface CVContextType {
  cvData: EmployeeCV | null;
  setCVData: (data: EmployeeCV) => void;
  updatePersonalData: (data: PersonalData) => void;
  submitCV: (data: EmployeeCV) => void;
  resetCV: () => void;
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
}

const CVContext = createContext<CVContextType | undefined>(undefined);

export function CVProvider({ children }: { children: ReactNode }) {
  const [cvData, setCVDataState] = useState<EmployeeCV | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const setCVData = (data: EmployeeCV) => {
    setCVDataState(data);
  };

  const updatePersonalData = (data: PersonalData) => {
    setCVDataState((prev) =>
      prev
        ? {
            ...prev,
            personalData: data,
            updatedAt: new Date().toISOString(),
          }
        : null
    );
  };

  const submitCV = (data: EmployeeCV) => {
    setCVDataState({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    setPreviewMode(true);
  };

  const resetCV = () => {
    setCVDataState(null);
    setPreviewMode(false);
  };

  return (
    <CVContext.Provider
      value={{
        cvData,
        setCVData,
        updatePersonalData,
        submitCV,
        resetCV,
        previewMode,
        setPreviewMode,
      }}
    >
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  const context = useContext(CVContext);
  if (!context) {
    throw new Error("useCV must be used within CVProvider");
  }
  return context;
}
