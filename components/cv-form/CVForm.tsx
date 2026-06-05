"use client";

import { useForm, FormProvider } from "react-hook-form";
import { EmployeeCV } from "@/types/employee";
import PersonalDataSection from "./PersonalDataSection";
import FamilyDataSection from "./FamilyDataSection";
import EmergencyContactSection from "./EmergencyContactSection";
import WorkExperienceSection from "./WorkExperienceSection";
import EmploymentStatusSection from "./EmploymentStatusSection";
import PromotionHistorySection from "./PromotionHistorySection";
import EducationSection from "./EducationSection";
import NonFormalEducationSection from "./NonFormalEducationSection";
import LanguageSkillsSection from "./LanguageSkillsSection";
import SkillsExpertiseSection from "./SkillsExpertiseSection";
import TrainingExperienceSection from "./TrainingExperienceSection";
import PreferenceSection from "./PreferenceSection";
import OrganizationExperienceSection from "./OrganizationExperienceSection";
import SocialActivitySection from "./SocialActivitySection";
import AchievementSection from "./AchievementSection";

interface CVFormProps {
  onSubmit: (cv: EmployeeCV) => void;
}

export default function CVForm({ onSubmit }: CVFormProps) {
  const methods = useForm<EmployeeCV>({
    defaultValues: {
      id: `EMP-TEMP`,
      personalData: {
        fullName: "",
        birthPlace: "",
        birthDate: "",
        ethnicity: "",
        gender: "L",
        bloodType: "",
        hobby: "",
        maritalStatus: "Belum Menikah",
        homePhone: "",
        personalPhone: "",
        officialEmail: "",
        ktpNumber: "",
        ktpExpiry: "",
        ktpAddress: "",
        currentAddress: "",
      },
      familyData: {
        coreFamily: [],
        extendedFamily: [],
      },
      emergencyContact: [],
      workExperience: [],
      employmentStatus: {
        joinDate: "",
        currentPosition: "",
      },
      promotionHistory: [],
      education: [],
      nonFormalEducation: [],
      languageSkills: [],
      skills: [],
      trainingExperience: [],
      preferences: [],
      organizationExperience: [],
      socialActivities: [],
      achievements: [],
      updatedAt: new Date().toISOString(),
    }
  });

  const { handleSubmit, reset } = methods;

  const onFormSubmit = (data: EmployeeCV) => {
    const finalData = {
      ...data,
      id: data.id === "EMP-TEMP" ? `EMP-${Date.now()}` : data.id,
      updatedAt: new Date().toISOString()
    };
    onSubmit(finalData);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pb-8">
        <PersonalDataSection />
        <FamilyDataSection />
        <EmergencyContactSection />
        <WorkExperienceSection />
        <EmploymentStatusSection />
        <PromotionHistorySection />
        <EducationSection />
        <NonFormalEducationSection />
        <LanguageSkillsSection />
        <SkillsExpertiseSection />
        <TrainingExperienceSection />
        <PreferenceSection />
        <OrganizationExperienceSection />
        <SocialActivitySection />
        <AchievementSection />

        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-ghost"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Simpan & Preview CV
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
