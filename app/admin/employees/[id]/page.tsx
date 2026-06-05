import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import DashboardLayout from "@/components/common/DashboardLayout";
import Link from "next/link";
import EmployeeProfileTabs from "@/components/admin/EmployeeProfileTabs";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const { user, profile: adminProfile } = await requireAdmin();
  const adminSupabase = createAdminClient();

  // Fetch ALL employee data from all tables
  const [
    { data: employee },
    { data: family },
    { data: experience },
    { data: education },
    { data: nonFormal },
    { data: languages },
    { data: skills },
    { data: training },
    { data: orgs },
    { data: social },
    { data: committee },
    { data: achievements },
    { data: promotions },
    { data: interests },
    { data: emergency },
    { data: documents }
  ] = await Promise.all([
    adminSupabase.from('employees').select('*').eq('id', id).single(),
    adminSupabase.from('family_members').select('*').eq('employee_id', id),
    adminSupabase.from('work_experiences').select('*').eq('employee_id', id).order('start_date', { ascending: false }),
    adminSupabase.from('educations').select('*').eq('employee_id', id).order('year', { ascending: false }),
    adminSupabase.from('non_formal_educations').select('*').eq('employee_id', id).order('year', { ascending: false }),
    adminSupabase.from('languages').select('*').eq('employee_id', id),
    adminSupabase.from('skills').select('*').eq('employee_id', id),
    adminSupabase.from('trainings').select('*').eq('employee_id', id).order('date', { ascending: false }),
    adminSupabase.from('org_experiences').select('*').eq('employee_id', id),
    adminSupabase.from('social_activities').select('*').eq('employee_id', id).order('start_date', { ascending: false }),
    adminSupabase.from('committee_experiences').select('*').eq('employee_id', id).order('year', { ascending: false }),
    adminSupabase.from('achievements').select('*').eq('employee_id', id).order('date', { ascending: false }),
    adminSupabase.from('promotion_histories').select('*').eq('employee_id', id).order('date', { ascending: false }),
    adminSupabase.from('career_interests').select('*').eq('employee_id', id),
    adminSupabase.from('emergency_contacts').select('*').eq('employee_id', id),
    adminSupabase.from('employee_documents').select('*').eq('employee_id', id)
  ]);

  if (!employee) notFound();

  const adminName = adminProfile?.name || user.email?.split('@')[0] || "Admin";
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <DashboardLayout
      role="Admin"
      userName={adminName}
      userInitials={adminInitials}
      userPhoto={adminProfile?.photo_url ?? undefined}
      menuSections={ADMIN_MENU}
    >
      <div className="flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
          <Link href="/admin/employees" className="hover:text-hris-red transition-colors">Direktori Karyawan</Link>
          <span>/</span>
          <span className="text-ink">Profil Karyawan</span>
        </div>

        {/* Header Profil */}
        <div className="glass p-6 flex flex-col md:flex-row gap-6 items-center md:items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
            <span className="text-9xl font-black italic">{employee.employee_code || 'ID-NEW'}</span>
          </div>
          
          <div className="relative shrink-0">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={employee.name} className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-white" />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-hris-yellow to-hris-red flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white">
                {employee.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2)}
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black border-2 border-white shadow-sm ${employee.status === 'Tetap' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
              {employee.status || 'PENDING'}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left pt-2">
            <div className="text-xs font-bold text-hris-red tracking-widest uppercase mb-1">{employee.employee_code || 'BELUM MEMILIKI ID'}</div>
            <h1 className="text-3xl font-black text-ink mb-1">{employee.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm font-medium text-ink-2">
              <div className="flex items-center gap-1.5"><span>💼</span> {employee.title || 'Posisi belum diatur'}</div>
              <div className="flex items-center gap-1.5"><span>🏢</span> {employee.dept || 'Departemen Umum'}</div>
              <div className="flex items-center gap-1.5"><span>📧</span> {employee.email}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:pt-2">
            <button className="btn btn-primary btn-sm">Validasi Data</button>
            <button className="btn btn-ghost btn-sm">Cetak Profil (PDF)</button>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <EmployeeProfileTabs 
          data={{
            employee, family, experience, education, nonFormal, 
            languages, skills, training, orgs, social, 
            committee, achievements, promotions, interests, emergency, documents
          }} 
        />
      </div>
    </DashboardLayout>
  );
}
