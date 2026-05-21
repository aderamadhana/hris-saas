// middleware.ts  ← REPLACE file yang lama dengan ini
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes yang tidak perlu auth
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/terms',
  '/privacy',
]

function isPublicRoute(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

// Mapping route → role yang diizinkan
// Middleware pakai cookie 'user-role' (tanpa DB call agar cepat)
const ROUTE_MIN_ROLES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/billing', roles: ['owner'] },
  { prefix: '/settings', roles: ['admin', 'owner'] },
  { prefix: '/payroll', roles: ['hr', 'admin', 'owner'] },
  { prefix: '/reports', roles: ['hr', 'admin', 'owner'] },
  { prefix: '/documents', roles: ['hr', 'admin', 'owner'] },
  { prefix: '/departments', roles: ['hr', 'admin', 'owner'] },
  { prefix: '/employees', roles: ['manager', 'hr', 'admin', 'owner'] },
  { prefix: '/performance', roles: ['manager', 'hr', 'admin', 'owner'] },
]

function getAllowedRoles(pathname: string): string[] | null {
  const path = pathname.startsWith('/dashboard')
    ? pathname.slice('/dashboard'.length) || '/'
    : pathname

  for (const { prefix, roles } of ROUTE_MIN_ROLES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return roles
    }
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Belum login → ke /login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Sudah login buka /login atau /register → ke /dashboard
  if (pathname === '/login' || pathname === '/register') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Root / → ke /dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role check via cookie user-role
  const allowedRoles = getAllowedRoles(pathname)
  if (allowedRoles) {
    const roleCookie = request.cookies.get('user-role')?.value
    if (roleCookie && !allowedRoles.includes(roleCookie)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
        redirectResponse.cookies.set(name, value)
      })
      return redirectResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}