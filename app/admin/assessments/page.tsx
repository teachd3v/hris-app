import { requireAdmin } from "@/lib/auth-guard";
import DashboardLayout from "@/components/common/DashboardLayout";
import Link from "next/link";
import { getDb } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { desc, sql } from 'drizzle-orm'

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

export default async function AdminAssessmentsPage() {
  const { user, profile: adminProfile } = await requireAdmin();
  const db = getDb();

  const [
    templates,
    allAssessments,
    empCountResult,
  ] = await Promise.all([
    db.select().from(schema.assessment_templates).orderBy(desc(schema.assessment_templates.created_at)),
    db.select({ template_id: schema.employee_assessments.template_id, status: schema.employee_assessments.status }).from(schema.employee_assessments),
    db.select({ count: sql<number>`count(*)` }).from(schema.employees),
  ]);

  const employeesCount = empCountResult[0]?.count || 0;

  const adminName = adminProfile?.name || user.email?.split('@')[0] || "Admin";
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  const completedTotal = allAssessments?.filter(a => a.status === 'Selesai').length || 0;
  const templatesCount = templates?.length || 0;
  const waitingTotal = Math.max(0, (templatesCount * employeesCount) - completedTotal);

  return (
    <DashboardLayout
      role="Admin"
      userName={adminName}
      userInitials={adminInitials}
      userPhoto={adminProfile?.photo_url ?? undefined}
      menuSections={ADMIN_MENU}
    >
      <div className="flex flex-col gap-8">
        {/* Page Header */}
        <div className="page-head items-end justify-between">
          <div>
            <span className="eyebrow">Data Analytics</span>
            <h1>Manajemen Asesmen</h1>
            <p>Pantau progres dan analisis hasil inputan karyawan secara terpusat.</p>
          </div>
          <button className="btn btn-primary btn-sm">➕ Buat Instrumen Baru</button>
        </div>

        {/* Global Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Instrumen" value={templatesCount} icon="📝" />
          <StatCard title="Selesai Diisi" value={completedTotal} icon="✅" color="text-green-600" />
          <StatCard title="Menunggu Jawaban" value={waitingTotal} icon="⏳" color="text-hris-yellow" />
        </div>

        {/* Templates Grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black text-ink uppercase tracking-wider">Instrumen Aktif</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {templates?.map(template => {
              const assessments = allAssessments?.filter(a => a.template_id === template.id) || [];
              const completedCount = assessments.filter(a => a.status === 'Selesai').length;
              const totalCount = Math.max(1, employeesCount); // Ground truth total non-admin employees
              const progress = Math.round((completedCount / totalCount) * 100);

              return (
                <Link 
                  key={template.id} 
                  href={`/admin/assessments/${template.id}`}
                  className="glass p-6 hover:translate-y-[-4px] transition-all group border border-transparent hover:border-hris-red/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-lg bg-black/5 text-[10px] font-black text-ink-3 uppercase tracking-widest">
                      {template.category}
                    </div>
                    <span className="text-2xl group-hover:scale-125 transition-transform">📊</span>
                  </div>
                  
                  <h3 className="text-xl font-black text-ink mb-2 leading-tight">{template.title}</h3>
                  <p className="text-sm text-ink-3 font-medium line-clamp-2 mb-6">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase">
                      <span className="text-ink-3">Progres Pengisian Karyawan</span>
                      <span className="text-hris-red">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-hris-red to-hris-yellow transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-ink-4 uppercase">Selesai</span>
                        <span className="text-sm font-black text-ink">{completedCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-ink-4 uppercase">Total Partisipan</span>
                        <span className="text-sm font-black text-ink">{employeesCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <span className="text-xs font-black text-hris-red uppercase tracking-widest group-hover:mr-2 transition-all">Lihat Analisis Lengkap →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color = "text-ink" }: { title: string; value: number | string; icon: string; color?: string }) {
  return (
    <div className="glass p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-2xl">{icon}</div>
      <div>
        <div className="text-[10px] font-black text-ink-3 uppercase tracking-widest">{title}</div>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}
