import { ShieldCheck, Tag } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginButton from "@/components/auth/LoginButton";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  if (user) {
    const ADMIN_EMAILS = ['teachgen2025@gmail.com', 'teach.d3v@gmail.com'];
    const emp = (session as any).employee;
    const isAdmin = emp?.role === 'Admin' || ADMIN_EMAILS.includes(user.email ?? '');
    
    if (isAdmin) {
      redirect('/admin/employees');
    } else {
      redirect('/employee/dashboard');
    }
  }

  // Detect mobile device on server
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  return isMobile ? (
    <MobileLogin />
  ) : (
    <DesktopLogin />
  );
}

// ==========================================
// DESKTOP VIEW
// ==========================================
function DesktopLogin() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[var(--red-soft)] to-transparent opacity-20 rounded-full blur-[150px] -mr-96 -mt-96 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-gradient-to-tr from-[var(--yellow-soft)] to-transparent opacity-10 rounded-full blur-[150px] -ml-96 -mb-96 pointer-events-none" />

      {/* Split Layout Container */}
      <div className="w-full max-w-6xl grid lg:grid-cols-2 items-center gap-12 md:gap-24 relative z-10">

        {/* Left Side: Headline & Brand */}
        <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="brand flex items-center gap-3 mb-12">
            <div className="brand-mark w-14 h-14" />
            <span className="text-2xl font-black tracking-tighter text-[var(--ink)] uppercase">TEACH <span className="text-[var(--ink-4)] font-bold">PORTAL</span></span>
          </div>

          <div className="space-y-6">
            <span className="eyebrow text-[var(--red)] font-black tracking-[0.3em] uppercase">Sistem Informasi Internal</span>
            <h1 className="text-5xl md:text-6xl font-black text-[var(--ink)] leading-[1.1] tracking-tighter">
              Pusat Kendali & <br />
              <span className="text-[var(--ink-4)]">Manajemen Insan.</span>
            </h1>
            <p className="text-xl text-[var(--ink-3)] leading-relaxed max-w-lg">
              Satu akses terintegrasi untuk seluruh kebutuhan administrasi dan pengembangan tim <br />
              <span className="text-[var(--ink)] font-bold">TEACH GREAT Edunesia.</span>
            </p>
          </div>

          <div className="mt-16 flex items-stretch gap-3">
            <div className="flex items-center gap-4 py-3 px-5 bg-[var(--surface-item)] w-fit rounded-2xl border border-[var(--line)]">
              <ShieldCheck size={18} className="text-[var(--red)]" />
              <span className="text-[10px] font-black text-[var(--ink-3)] uppercase tracking-[0.2em]">Verified Internal Access Only</span>
            </div>
            <div className="flex items-center gap-4 px-5 bg-[var(--surface-item)] w-fit rounded-2xl border border-[var(--line)]">
              <Tag size={18} className="text-[var(--red)]" />
              <span className="text-[10px] font-black text-[var(--ink-3)] uppercase tracking-[0.2em]">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="glass-strong p-10 md:p-14 rounded-[48px] border border-[var(--glass-border)] shadow-[0_40px_120px_rgba(0,0,0,0.5)] max-w-lg mx-auto lg:mr-0">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-[var(--ink)] mb-3 tracking-tight">Masuk Portal</h2>
              <p className="text-[var(--ink-3)] text-sm font-medium">Silakan masuk menggunakan akun Google Anda.</p>
            </div>

            <LoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MOBILE VIEW
// ==========================================
function MobileLogin() {
  return (
    <div className="h-[100dvh] w-full bg-[var(--bg)] flex flex-col items-center justify-center relative overflow-hidden font-jakarta px-5">
      {/* Ornaments for Mobile */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-[var(--red-soft)] rounded-full mix-blend-multiply filter blur-[60px] opacity-40 pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[80vw] h-[80vw] bg-[var(--yellow-soft)] rounded-full mix-blend-multiply filter blur-[60px] opacity-40 pointer-events-none" />

      {/* Content wrapper */}
      <div className="w-full max-w-sm flex flex-col justify-center relative z-10">
        
        {/* Brand Area */}
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 bg-gradient-to-br from-[#DC2626] to-[#FACC15] rounded-[24px] shadow-[0_10px_20px_rgba(220,38,38,0.3)] mb-6 flex items-center justify-center p-1 relative">
             <div className="absolute inset-1 border-2 border-white/80 rounded-[20px]"></div>
          </div>
          <span className="eyebrow text-[var(--red)] mb-3">TEACH GREAT Edunesia</span>
          <h1 className="text-[clamp(32px,8vw,40px)] font-black text-[var(--ink)] tracking-tight leading-tight mb-4">
            Portal <span className="text-[var(--ink-4)]">Insan.</span>
          </h1>
          <p className="text-[var(--ink-3)] text-[13px] px-4 max-w-[280px]">
            Satu akses terintegrasi untuk seluruh kebutuhan administrasi dan pengembangan tim.
          </p>
        </div>

        {/* Spacer */}
        <div className="h-10 md:h-12"></div>

        {/* Login Area */}
        <div className="w-full glass-strong rounded-[32px] p-6 shadow-2xl border border-[var(--glass-border)] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[var(--ink)] mb-1">Selamat Datang</h2>
            <p className="text-[var(--ink-3)] text-xs">Silakan login untuk melanjutkan</p>
          </div>
          
          <LoginButton />

          <div className="mt-5 flex justify-center items-center gap-2 text-[10px] font-bold text-[var(--ink-4)] uppercase tracking-wider">
            <ShieldCheck size={14} className="text-[var(--red)]" />
            Internal Access Only
          </div>
        </div>

      </div>
    </div>
  );
}
