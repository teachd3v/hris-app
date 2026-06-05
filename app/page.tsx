import { ShieldCheck, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: emp } = await supabase
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single();

    const ADMIN_EMAILS = ['teachgen2025@gmail.com', 'teach.d3v@gmail.com'];
    const isAdmin = emp?.role === 'Admin' || ADMIN_EMAILS.includes(user.email ?? '');
    
    if (isAdmin) {
      redirect('/admin/employees');
    } else {
      redirect('/employee/dashboard');
    }
  }

  const signInWithGoogle = async () => {
    "use server"
    
    const supabase = await createClient()
    const headersList = await headers()
    const host = headersList.get('host')
    
    // Determine protocol: http for localhost, https for production
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${protocol}://${host}/auth/callback`,
      },
    })
    
    if (data.url) {
      redirect(data.url)
    }
  }

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
            <span className="text-2xl font-black tracking-tighter text-ink uppercase">TEACH <span className="text-ink-4 font-bold">PORTAL</span></span>
          </div>

          <div className="space-y-6">
            <span className="eyebrow text-[var(--red)] font-black tracking-[0.3em] uppercase">Sistem Informasi Internal</span>
            <h1 className="text-5xl md:text-6xl font-black text-ink leading-[1.1] tracking-tighter">
              Pusat Kendali & <br />
              <span className="text-ink-4">Manajemen Insan.</span>
            </h1>
            <p className="text-xl text-ink-3 leading-relaxed max-w-lg">
              Satu akses terintegrasi untuk seluruh kebutuhan administrasi dan pengembangan tim <br />
              <span className="text-ink font-bold">TEACH GREAT Edunesia.</span>
            </p>
          </div>

          <div className="mt-16 flex items-stretch gap-3">
            <div className="flex items-center gap-4 py-3 px-5 bg-[var(--surface-item)] w-fit rounded-2xl border border-[var(--line)]">
              <ShieldCheck size={18} className="text-[var(--red)]" />
              <span className="text-[10px] font-black text-ink-3 uppercase tracking-[0.2em]">Verified Internal Access Only</span>
            </div>
            <div className="flex items-center gap-4 px-5 bg-[var(--surface-item)] w-fit rounded-2xl border border-[var(--line)]">
              <Tag size={18} className="text-[var(--red)]" />
              <span className="text-[10px] font-black text-ink-3 uppercase tracking-[0.2em]">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="glass-strong p-10 md:p-14 rounded-[48px] border border-[var(--glass-border)] shadow-[0_40px_120px_rgba(0,0,0,0.5)] max-w-lg mx-auto lg:mr-0">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-ink mb-3 tracking-tight">Masuk Portal</h2>
              <p className="text-ink-3 text-sm font-medium">Silakan masuk menggunakan akun Google Anda.</p>
            </div>

            <form action={signInWithGoogle} className="space-y-5">
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-white border border-line-2 text-ink hover:bg-slate-50 transition-colors py-4 px-4 rounded-2xl font-bold shadow-sm"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                  </svg>
                  Lanjutkan dengan Google
                </button>
              </div>
            </form>

            <div className="mt-10 pt-8 border-t border-[var(--line)] text-center">
              <p className="text-[10px] font-bold text-ink-4 uppercase tracking-[0.2em] leading-relaxed">
                Lupa akses? Hubungi <a href="#" className="text-ink hover:text-[var(--red)] transition-colors underline decoration-2 underline-offset-4">IT TEACH</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
