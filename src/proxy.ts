import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/about',
  '/features',
  '/pricing',
]

// Auth routes - redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password']

// Check if a path is public (doesn't require auth)
const isPublicPath = (pathname: string): boolean => {
  if (publicRoutes.includes(pathname)) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.includes('.')) return true // static files
  return false
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token in cookies
  const authToken = request.cookies.get('nurseos-token')?.value
  const isAuthenticated = !!authToken

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && authRoutes.includes(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
