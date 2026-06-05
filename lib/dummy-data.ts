import { Employee } from "@/types/employee";

export const dummyEmployees: Employee[] = [];

// Comprehensive user profile for dashboard
export const dummyUserProfile = {
  // Data Personal
  id: "",
  employeeCode: "",
  name: "",
  initials: "",
  photo: undefined as string | undefined,
  email: "",
  phone: "",
  nik: "",
  birth: "",
  gender: "",
  bloodType: "",
  nationality: "Indonesia",
  maritalStatus: "",
  religion: "Islam",
  address: "",
  ktpAddress: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Indonesia",

  // Employment Info
  title: "-",
  dept: "-",
  level: "-",
  status: "-",
  join: "",
  tenure: "-",
  manager: "-",

  // Banking
  bank: "",

  // Leave & Attendance
  leave: {
    total: 12,
    used: 0,
  },
  attendance: {
    present: 0,
    late: 0,
  },

  // Data Keluarga
  family: [] as Array<{
    id: string;
    relationship: string;
    name: string;
    birthDate: string;
    occupation: string;
    phone: string;
  }>,

  // Kontak Terdekat
  emergencyContacts: [] as Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    address: string;
  }>,

  // Pengalaman Bekerja
  workExperience: [] as Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>,

  // Riwayat Promosi & Mutasi
  promotionHistory: [] as Array<{
    id: string;
    date: string;
    type: string;
    from: string;
    to: string;
  }>,

  // Riwayat Pendidikan
  education: [] as Array<{
    id: string;
    institution: string;
    level: string;
    field: string;
    year: string;
  }>,

  // Pendidikan Non Formal
  nonFormalEducation: [] as Array<{
    id: string;
    name: string;
    institution: string;
    year: string;
  }>,

  // Kemampuan Bahasa
  languages: [] as Array<{
    id: string;
    name: string;
    proficiency: string;
  }>,

  // Keterampilan/Keahlian
  skills: [] as Array<{
    id: string;
    name: string;
    proficiency: string;
  }>,

  // Pengalaman Training
  training: [] as Array<{
    id: string;
    name: string;
    provider: string;
    date: string;
  }>,

  // Peminatan (Career Interests)
  careerInterests: [] as Array<{
    id: string;
    position: string;
    department: string;
  }>,

  // Pengalaman Organisasi
  orgExperience: [] as Array<{
    id: string;
    organization: string;
    role: string;
    period: string;
  }>,

  // Aktivitas Sosial/Kerelawanan
  socialActivities: [] as Array<{
    id: string;
    activity: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
  }>,

  // Kepanitiaan
  committeeExperience: [] as Array<{
    id: string;
    event: string;
    role: string;
    year: string;
  }>,

  // Prestasi
  achievements: [] as Array<{
    id: string;
    title: string;
    level: string;
    date: string;
    description: string;
  }>,
};

// Untuk testing form submission, kita bisa extend dengan function untuk add employee
export const addDummyEmployee = (employees: Employee[], newEmployee: Employee): Employee[] => {
  return [...employees, newEmployee];
};

export type DocumentCategory = "Pendidikan" | "Pelatihan" | "Prestasi" | "Identitas" | "Pekerjaan" | "Lainnya";

export interface EmployeeDocument {
  id: string;
  title: string;
  type: string;
  size: string;
  date: string;
  category: DocumentCategory;
  subCategory?: string;
  fileUrl?: string; // Legacy field for single file
  files?: Array<{
    url: string;
    name: string;
    size: string;
    type: string;
  }>;
}

export const dummyDocuments: EmployeeDocument[] = [];

export type AssessmentStatus = "Belum Diisi" | "Selesai" | "Terlewat";

export interface EmployeeAssessment {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  status: AssessmentStatus;
  isRequired: boolean;
}

export const dummyAssessments: EmployeeAssessment[] = [];

