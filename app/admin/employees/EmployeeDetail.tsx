import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import DashboardLayout from "@/components/common/DashboardLayout";
import Link from "next/link";
import EmployeeProfileTabs from "@/components/admin/EmployeeProfileTabs";
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

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

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile: adminProfile } = await requireAdmin();
  const db = getDb();

  // Fetch ALL employee data from all tables
  const [
    employeeRecords,
    family,
    experience,
    education,
    nonFormal,
    languages,
    skills,
    training,
    orgs,
    social,
    committee,
    achievements,
    promotions,
    interests,
    emergency,
    documents
  ] = await Promise.all([
    db.select().from(schema.employees).where(eq(schema.employees.id, id)).limit(1),
    db.select().from(schema.family_members).where(eq(schema.family_members.employee_id, id)),
    db.select().from(schema.work_experiences).where(eq(schema.work_experiences.employee_id, id)).orderBy(desc(schema.work_experiences.start_date)),
    db.select().from(schema.educations).where(eq(schema.educations.employee_id, id)).orderBy(desc(schema.educations.year)),
    db.select().from(schema.non_formal_educations).where(eq(schema.non_formal_educations.employee_id, id)).orderBy(desc(schema.non_formal_educations.year)),
    db.select().from(schema.languages).where(eq(schema.languages.employee_id, id)),
    db.select().from(schema.skills).where(eq(schema.skills.employee_id, id)),
    db.select().from(schema.trainings).where(eq(schema.trainings.employee_id, id)).orderBy(desc(schema.trainings.date)),
    db.select().from(schema.org_experiences).where(eq(schema.org_experiences.employee_id, id)),
    db.select().from(schema.social_activities).where(eq(schema.social_activities.employee_id, id)).orderBy(desc(schema.social_activities.start_date)),
    db.select().from(schema.committee_experiences).where(eq(schema.committee_experiences.employee_id, id)).orderBy(desc(schema.committee_experiences.year)),
    db.select().from(schema.achievements).where(eq(schema.achievements.employee_id, id)).orderBy(desc(schema.achievements.date)),
    db.select().from(schema.promotion_histories).where(eq(schema.promotion_histories.employee_id, id)).orderBy(desc(schema.promotion_histories.date)),
    db.select().from(schema.career_interests).where(eq(schema.career_interests.employee_id, id)),
    db.select().from(schema.emergency_contacts).where(eq(schema.emergency_contacts.employee_id, id)),
    db.select().from(schema.employee_documents).where(eq(schema.employee_documents.employee_id, id))
  ]);

  if (employeeRecords.length === 0) notFound();
  const employee = employeeRecords[0];

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
              <img src={employee.photo_url} alt={employee.name || ''} className="w-32 h-32 rounded-3xl object-cover shadow-xl border-4 border-white" />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-hris-yellow to-hris-red flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white">
                {(employee.name || '').split(' ').map((n: any) => n[0]).join('').substring(0, 2)}
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
            committee, achievements, promotions, interests, emergency, documents: documents.map((d: any) => ({ ...d, files: typeof d.files === 'string' ? JSON.parse(d.files) : d.files }))
          }} 
        />
      </div>
    </DashboardLayout>
  );
}
