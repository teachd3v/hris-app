"use client";

import EditSectionModal from "@/components/common/EditSectionModal";
import type { dummyUserProfile } from "@/lib/dummy-data";
import DataPersonalForm from "./DataPersonalForm";
import BankEmergencyForm from "./BankEmergencyForm";
import FamilyForm from "./FamilyForm";
import EmergencyContactsForm from "./EmergencyContactsForm";
import EmploymentInfoForm from "./EmploymentInfoForm";
import WorkExperienceForm from "./WorkExperienceForm";
import PromotionHistoryForm from "./PromotionHistoryForm";
import CareerInterestsForm from "./CareerInterestsForm";
import EducationForm from "./EducationForm";
import NonFormalEducationForm from "./NonFormalEducationForm";
import TrainingForm from "./TrainingForm";
import LanguagesForm from "./LanguagesForm";
import SkillsForm from "./SkillsForm";
import OrgExperienceForm from "./OrgExperienceForm";
import SocialActivitiesForm from "./SocialActivitiesForm";
import AchievementsForm from "./AchievementsForm";
import CommitteeExperienceForm from "./CommitteeExperienceForm";

export type EditSectionKey =
  | "personal"
  | "bank"
  | "family"
  | "emergency-contacts"
  | "employment"
  | "work-experience"
  | "promotion-history"
  | "career-interests"
  | "education"
  | "non-formal-education"
  | "training"
  | "languages"
  | "skills"
  | "org-experience"
  | "social-activities"
  | "committee-experience"
  | "achievements";

type ProfileData = typeof dummyUserProfile;

interface Props {
  section: EditSectionKey | null;
  data: ProfileData;
  onClose: () => void;
  onSave: (updates: Partial<ProfileData>) => void;
}

export default function EditSectionModals({ section, data, onClose, onSave }: Props) {
  if (section === "personal") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Data Personal"
        subtitle="Perbarui identitas dan kontak Anda."
        formId="form-personal"
      >
        <DataPersonalForm
          formId="form-personal"
          defaultValues={{
            email: data.email,
            phone: data.phone,
            nik: data.nik,
            birth: data.birth,
            gender: data.gender,
            bloodType: data.bloodType || "",
            nationality: data.nationality,
            maritalStatus: data.maritalStatus,
            religion: data.religion,
            address: data.address,
            ktpAddress: data.ktpAddress || "",
            city: data.city,
            province: data.province,
            postalCode: data.postalCode,
            country: data.country,
          }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "bank") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Informasi Bank"
        subtitle="Data pembayaran gaji Anda."
        formId="form-bank"
      >
        <BankEmergencyForm
          formId="form-bank"
          defaultValues={{ bank: data.bank }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "family") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Keluarga"
        subtitle="Tambah, ubah, atau hapus anggota keluarga."
        formId="form-family"
      >
        <FamilyForm
          formId="form-family"
          defaultValues={{ family: data.family }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "emergency-contacts") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Kontak Darurat"
        subtitle="Hubungi bila terjadi keadaan darurat."
        formId="form-emergency-contacts"
      >
        <EmergencyContactsForm
          formId="form-emergency-contacts"
          defaultValues={{ emergencyContacts: data.emergencyContacts }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "employment") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Informasi Pekerjaan"
        subtitle="Posisi dan status karyawan Anda."
        formId="form-employment"
      >
        <EmploymentInfoForm
          formId="form-employment"
          defaultValues={{
            employeeCode: data.employeeCode || "",
            title: data.title,
            dept: data.dept,
            level: data.level,
            status: data.status,
            join: data.join,
            tenure: data.tenure,
            manager: data.manager,
          }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "work-experience") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Pengalaman Kerja"
        subtitle="Riwayat karier sebelumnya dan saat ini."
        formId="form-work-experience"
      >
        <WorkExperienceForm
          formId="form-work-experience"
          defaultValues={{ workExperience: data.workExperience }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "promotion-history") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Promosi & Mutasi"
        subtitle="Riwayat perubahan posisi internal."
        formId="form-promotion-history"
      >
        <PromotionHistoryForm
          formId="form-promotion-history"
          defaultValues={{ promotionHistory: data.promotionHistory }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "career-interests") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Peminatan Karier"
        subtitle="Posisi yang ingin dicapai ke depan."
        formId="form-career-interests"
      >
        <CareerInterestsForm
          formId="form-career-interests"
          defaultValues={{ careerInterests: data.careerInterests }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "education") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Pendidikan Formal"
        subtitle="Latar belakang pendidikan akademik."
        formId="form-education"
      >
        <EducationForm
          formId="form-education"
          defaultValues={{ education: data.education }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "non-formal-education") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Pendidikan Non-Formal"
        subtitle="Kursus dan sertifikasi pendukung."
        formId="form-non-formal-education"
      >
        <NonFormalEducationForm
          formId="form-non-formal-education"
          defaultValues={{ nonFormalEducation: data.nonFormalEducation }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "training") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Training & Sertifikasi"
        subtitle="Program pelatihan yang pernah diikuti."
        formId="form-training"
      >
        <TrainingForm
          formId="form-training"
          defaultValues={{ training: data.training }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "languages") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Bahasa"
        subtitle="Kemampuan berbahasa yang dikuasai."
        formId="form-languages"
      >
        <LanguagesForm
          formId="form-languages"
          defaultValues={{ languages: data.languages }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "skills") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Skills & Keahlian"
        subtitle="Kompetensi teknis dan non-teknis."
        formId="form-skills"
      >
        <SkillsForm
          formId="form-skills"
          defaultValues={{ skills: data.skills }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "org-experience") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Pengalaman Organisasi"
        subtitle="Keterlibatan dalam komunitas atau organisasi."
        formId="form-org-experience"
      >
        <OrgExperienceForm
          formId="form-org-experience"
          defaultValues={{ orgExperience: data.orgExperience }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "social-activities") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Aktivitas Sosial"
        subtitle="Kegiatan kerelawanan dan kontribusi sosial."
        formId="form-social-activities"
      >
        <SocialActivitiesForm
          formId="form-social-activities"
          defaultValues={{ socialActivities: data.socialActivities }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "achievements") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Prestasi"
        subtitle="Penghargaan dan pencapaian."
        formId="form-achievements"
      >
        <AchievementsForm
          formId="form-achievements"
          defaultValues={{ achievements: data.achievements }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  if (section === "committee-experience") {
    return (
      <EditSectionModal
        open
        onClose={onClose}
        title="Edit Pengalaman Kepanitiaan"
        subtitle="Keterlibatan sebagai panitia event internal/eksternal."
        formId="form-committee-experience"
      >
        <CommitteeExperienceForm
          formId="form-committee-experience"
          defaultValues={{ committeeExperience: data.committeeExperience || [] }}
          onSubmit={onSave}
        />
      </EditSectionModal>
    );
  }

  return null;
}
