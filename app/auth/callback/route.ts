import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('role')
          .eq('id', user.id)
          .single();

        const isAdmin = emp?.role === 'Admin' || user.email === 'teach.d3v@gmail.com';
        
        if (isAdmin) {
          return NextResponse.redirect(`${origin}/admin/employees`)
        } else {
          return NextResponse.redirect(`${origin}/employee/dashboard`)
        }
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth-callback-failed`)
}
