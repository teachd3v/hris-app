import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/employee') || request.nextUrl.pathname.startsWith('/admin'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // RBAC for authenticated users
  if (user) {
    // Fetch role from employees table
    const { data: emp } = await supabase
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single();

    const ADMIN_EMAILS = ['teachgen2025@gmail.com', 'teach.d3v@gmail.com'];
    const isAdmin = emp?.role === 'Admin' || ADMIN_EMAILS.includes(user.email ?? '');
    const isRootPath = request.nextUrl.pathname === '/'
    const isEmployeePath = request.nextUrl.pathname.startsWith('/employee')
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

    if (isAdmin) {
      // Admin trying to access root -> redirect to admin
      // Note: We allow admins to access employee paths if they want to switch mode
      if (isRootPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/employees'
        return NextResponse.redirect(url)
      }
    } else {
      // Employee trying to access root or admin routes -> redirect to employee
      if (isRootPath || isAdminPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/employee/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
