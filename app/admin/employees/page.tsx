import DashboardLayout from "@/components/common/DashboardLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-guard";

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
  const adminSupabase = createAdminClient();
  const { data: employeesData, error: employeesError } = await adminSupabase
    .from('employees')
    .select(`
      *,
      emergency_contacts(id),
      family_members(id),
      work_experiences(id),
      career_interests(id),
      educations(id),
      skills(id),
      languages(id),
      org_experiences(id),
      employee_documents(id)
    `)
    .order('name');

  if (employeesError) {
    console.error("Detailed Supabase Error:", JSON.stringify(employeesError, null, 2));
  }

  const userName = profile?.name || user.email?.split('@')[0] || "Admin";
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  // Transform database data to match UI needs
  const employees = (employeesData || []).map(emp => {
    // Section-based Progress Calculation (11 Sections)
    const sections = [
      { name: 'Data Personal', filled: !!(emp.nik && emp.phone && emp.birth_date && emp.gender && emp.photo_url && emp.ktp_address) },
      { name: 'Informasi Perbankan', filled: !!emp.bank },
      { name: 'Kontak Darurat', filled: (emp.emergency_contacts?.length || 0) > 0 },
      { name: 'Data Keluarga', filled: (emp.family_members?.length || 0) > 0 },
      { name: 'Informasi Pekerjaan', filled: !!(emp.join_date && emp.title && emp.dept) },
      { name: 'Pengalaman Kerja', filled: (emp.work_experiences?.length || 0) > 0 },
      { name: 'Peminatan Karir', filled: (emp.career_interests?.length || 0) > 0 },
      { name: 'Pendidikan Formal', filled: (emp.educations?.length || 0) > 0 },
      { name: 'Keahlian & Kemampuan', filled: (emp.skills?.length || 0) > 0 },
      { name: 'Kemampuan Bahasa', filled: (emp.languages?.length || 0) > 0 },
      { name: 'Pengalaman Organisasi', filled: (emp.org_experiences?.length || 0) > 0 }
    ];

    const filledSections = sections.filter(s => s.filled).length;
    const profileProgress = Math.round((filledSections / sections.length) * 100);

    return {
      ...emp,
      fullName: emp.name,
      position: emp.title || 'Belum diatur',
      department: emp.dept || 'Umum',
      photo: emp.photo_url,
      documentCount: emp.employee_documents?.length || 0,
      profileProgress // Pass calculated progress to dashboard
    };
  });

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
