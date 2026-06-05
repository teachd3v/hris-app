// Personal Information
export interface PersonalData {
  photo?: File | string;
  fullName: string;
  birthPlace: string;
  birthDate: string;
  ethnicity: string;
  gender: "L" | "P";
  bloodType: string;
  hobby: string;
  maritalStatus: "Belum Menikah" | "Menikah" | "Cerai" | "Duda/Janda";
  marriageDate?: string;
  homePhone?: string;
  personalPhone: string;
  spousePhone?: string;
  officialEmail: string;
  otherEmail?: string;
  ktpNumber: string;
  ktpExpiry: string;
  simCNumber?: string;
  simCExpiry?: string;
  npwpNumber?: string;
  socialMedia?: string;
  ktpAddress: string;
  currentAddress: string;
}

// Family Member
export interface FamilyMember {
  name: string;
  birthPlace: string;
  birthDate: string;
  gender: "L" | "P";
  occupationEducation: string;
}

// Family Data
export interface FamilyData {
  coreFamily: FamilyMember[]; // Pasangan, Anak 1, Anak 2, dst
  extendedFamily: FamilyMember[]; // Ayah, Ibu, Kakak, Adik
}

// Emergency Contact
export interface EmergencyContact {
  name: string;
  relationship: string;
  address: string;
  phoneNumber: string;
}

// Work Experience
export interface WorkExperience {
  companyName: string;
  position: string;
  workPeriod: string;
}

// Employment Status
export interface EmploymentStatus {
  joinDate: string;
  permanentDate?: string;
  permanentPosition?: string;
  currentPosition: string;
}

// Promotion/Mutation History
export interface PromotionHistory {
  programName: string;
  position: string;
  workPeriod: string;
}

// Education Record
export interface EducationRecord {
  level: string;
  schoolName: string;
  major: string;
  year: string;
}

// Non-Formal Education/Certification
export interface Certification {
  trainingName: string;
  institution: string;
  executionDate: string;
  certificateFile?: File | string;
  materialFile?: File | string;
}

// Language Skill
export interface LanguageSkill {
  skillType: "Mendengar" | "Berbicara" | "Membaca" | "Menulis";
  language: string;
  proficiency: string;
}

// General Skill
export interface Skill {
  skillType: string;
  description: string;
  level: "BASIC" | "INTERMEDIATE" | "ADVANCE";
}

// Training Experience
export interface TrainingExperience {
  material: string;
  description: string;
  level: "BASIC" | "INTERMEDIATE" | "ADVANCE";
  tier: "INTERNAL DD NET" | "KABUPATEN/KOTA" | "PROVINSI" | "NASIONAL" | "INTERNASIONAL";
}

// Preference/Peminatan
export interface Preference {
  type: string;
  background: string;
}

// Organization Experience
export interface OrganizationExperience {
  organizationName: string;
  position: string;
  periodPosition: string;
}

// Social Activity
export interface SocialActivity {
  activity: string;
  positionOrganization: string;
  location: string;
  year: string;
  description: string;
}

// Achievement
export interface Achievement {
  achievement: string;
  tier: string;
  year: string;
}

// Complete Employee CV
export interface EmployeeCV {
  id: string;
  personalData: PersonalData;
  familyData: FamilyData;
  emergencyContact: EmergencyContact[];
  workExperience: WorkExperience[];
  employmentStatus: EmploymentStatus;
  promotionHistory: PromotionHistory[];
  education: EducationRecord[];
  nonFormalEducation: Certification[];
  languageSkills: LanguageSkill[];
  skills: Skill[];
  trainingExperience: TrainingExperience[];
  preferences: Preference[];
  organizationExperience: OrganizationExperience[];
  socialActivities: SocialActivity[];
  achievements: Achievement[];
  updatedAt: string;
}

// Employee Catalog (simplified view for admin)
export interface Employee {
  id: string;
  fullName: string;
  photo?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  cv?: EmployeeCV;
}
