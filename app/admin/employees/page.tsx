import DashboardLayout from "@/components/common/DashboardLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/auth-guard";
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'

const ADMIN_MENU = [
  {
    label: "Manajemen",
    items: [
      { icon: "👥", label: "Karyawan", href: "/admin/employees" },
      { icon: "📊", label: "Asesmen", href: "/admin/assessments" },
      { icon: "🏠", label: "Dasbor", href: "/admin/dashboard", isComingSoon: true },
      { icon: "⏰", label: "Presensi", href: "/admin/attendance", isComingSoon: true },
      { icon: "📅", label: "Pengajuan Cuti", href: "/admin/leave-requests", isComingSoon: true },
      { icon: "💰", label: "Payroll", href: "/admin/payroll", isComingSoon: true },
    ]
  },
  {
    label: "Lainnya",
    items: [
      { icon: "📈", label: "Laporan", href: "/admin/reports", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/admin/settings", isComingSoon: true },
    ]
  }
];

export default async function AdminEmployeesPage() {
  const { user, profile } = await requireAdmin();
  const db = getDb();

  const employeesData = await db.select().from(schema.employees);
  const employeeIds = employeesData.map(e => e.id);

  // Fallback for empty employee list
  if (employeeIds.length === 0) {
    return (
      <DashboardLayout
        role="Admin"
        userName={profile?.name || user.email?.split('@')[0] || "Admin"}
        userInitials={(profile?.name || user.email?.split('@')[0] || "Admin").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
        userPhoto={profile?.photo_url ?? undefined}
        menuSections={ADMIN_MENU}
      >
        <AdminDashboard employees={[]} />
      </DashboardLayout>
    );
  }

  // Fetch relations counts/existence efficiently
  const [
    emergencyContacts,
    familyMembers,
    workExperiences,
    careerInterests,
    educations,
    skills,
    languages,
    orgExperiences,
    employeeDocuments
  ] = await Promise.all([
    db.select({ employee_id: schema.emergency_contacts.employee_id }).from(schema.emergency_contacts).where(inArray(schema.emergency_contacts.employee_id, employeeIds)),
    db.select({ employee_id: schema.family_members.employee_id }).from(schema.family_members).where(inArray(schema.family_members.employee_id, employeeIds)),
    db.select({ employee_id: schema.work_experiences.employee_id }).from(schema.work_experiences).where(inArray(schema.work_experiences.employee_id, employeeIds)),
    db.select({ employee_id: schema.career_interests.employee_id }).from(schema.career_interests).where(inArray(schema.career_interests.employee_id, employeeIds)),
    db.select({ employee_id: schema.educations.employee_id }).from(schema.educations).where(inArray(schema.educations.employee_id, employeeIds)),
    db.select({ employee_id: schema.skills.employee_id }).from(schema.skills).where(inArray(schema.skills.employee_id, employeeIds)),
    db.select({ employee_id: schema.languages.employee_id }).from(schema.languages).where(inArray(schema.languages.employee_id, employeeIds)),
    db.select({ employee_id: schema.org_experiences.employee_id }).from(schema.org_experiences).where(inArray(schema.org_experiences.employee_id, employeeIds)),
    db.select({ employee_id: schema.employee_documents.employee_id }).from(schema.employee_documents).where(inArray(schema.employee_documents.employee_id, employeeIds)),
  ]);

  // Helper to check if an employee has a record in the relation
  const hasRecord = (arr: any[], empId: string) => arr.some(item => item.employee_id === empId);

  const userName = profile?.name || user.email?.split('@')[0] || "Admin";
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  // Transform database data to match UI needs
  const employees = employeesData.map(emp => {
    // Section-based Progress Calculation (11 Sections)
    const sections = [
      { name: 'Data Personal', filled: !!(emp.nik && emp.phone && emp.birth_date && emp.gender && emp.photo_url && emp.ktp_address) },
      { name: 'Informasi Perbankan', filled: !!emp.bank },
      { name: 'Kontak Darurat', filled: hasRecord(emergencyContacts, emp.id) },
      { name: 'Data Keluarga', filled: hasRecord(familyMembers, emp.id) },
      { name: 'Informasi Pekerjaan', filled: !!(emp.join_date && emp.title && emp.dept) },
      { name: 'Pengalaman Kerja', filled: hasRecord(workExperiences, emp.id) },
      { name: 'Peminatan Karir', filled: hasRecord(careerInterests, emp.id) },
      { name: 'Pendidikan Formal', filled: hasRecord(educations, emp.id) },
      { name: 'Keahlian & Kemampuan', filled: hasRecord(skills, emp.id) },
      { name: 'Kemampuan Bahasa', filled: hasRecord(languages, emp.id) },
      { name: 'Pengalaman Organisasi', filled: hasRecord(orgExperiences, emp.id) }
    ];

    const filledSections = sections.filter(s => s.filled).length;
    const profileProgress = Math.round((filledSections / sections.length) * 100);
    const documentCount = employeeDocuments.filter(d => d.employee_id === emp.id).length;

    return {
      ...emp,
      fullName: emp.name,
      position: emp.title || 'Belum diatur',
      department: emp.dept || 'Umum',
      photo: emp.photo_url,
      documentCount: documentCount,
      profileProgress // Pass calculated progress to dashboard
    };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <DashboardLayout
      role="Admin"
      userName={userName}
      userInitials={userInitials}
      userPhoto={profile?.photo_url ?? undefined}
      menuSections={ADMIN_MENU}
    >
      <AdminDashboard employees={employees as any} />
    </DashboardLayout>
  );
}
