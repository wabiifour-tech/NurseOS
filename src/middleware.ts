import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication and SHOULD be indexed by Google
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/about',
  '/features',
  '/pricing',
  '/privacy',
  '/terms',
  '/hipaa',
  '/ndpr',
  '/onboarding',
  '/auth/callback',
  '/sitemap.xml',
]

// Auth routes - redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password']

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/oauth/link',
  '/api/auth/oauth/complete',
  '/api/health',
  '/api/setup',
]

// NextAuth.js internal routes that must be public
const nextAuthRoutes = [
  '/api/auth/providers',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
]

// Routes that are accessible even without a facility assignment
const noFacilityRequiredRoutes = [
  '/settings',
  '/nurseid',
  '/academy',
  '/caregrid/knowledge',
  '/help',
  '/admin',
  '/superadmin',
  '/subscription',
  '/messages',
  '/announcements',
]

// Check if a path is public (doesn't require auth)
const isPublicPath = (pathname: string): boolean => {
  if (publicRoutes.includes(pathname)) return true
  // Only allow specifically whitelisted API routes without auth
  if (pathname.startsWith('/api/')) {
    return publicApiRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) ||
           nextAuthRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  }
  if (pathname.startsWith('/_next/')) return true
  if (pathname.includes('.')) return true // static files
  return false
}

// Check if a path is accessible without a facility assignment
const isNoFacilityRequiredPath = (pathname: string): boolean => {
  if (noFacilityRequiredRoutes.some(route => pathname.startsWith(route))) return true
  return false
}

// Detect if the request is from a search engine bot
const isSearchBot = (request: NextRequest): boolean => {
  const ua = request.headers.get('user-agent') || ''
  const botPatterns = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
    'YandexBot', 'Sogou', 'Exabot', 'facebot', 'facebookexternalhit',
    'ia_archiver', 'AhrefsBot', 'MJ12bot', 'SemrushBot',
  ]
  return botPatterns.some(bot => ua.includes(bot))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token in cookies
  const authToken = request.cookies.get('nurseos-token')?.value
  const isAuthenticated = !!authToken

  // Check for the clear-auth query param
  const clearAuth = request.nextUrl.searchParams.get('clearAuth')
  if (clearAuth === '1') {
    const redirectUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('nurseos-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && authRoutes.includes(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && !isPublicPath(pathname)) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For search engine bots: return 404 instead of redirecting to /login.
    // This tells Google "this page doesn't exist for unauthenticated users"
    // instead of "this page redirects somewhere else", which prevents the
    // "Page with redirect" indexing issue in Google Search Console.
    if (isSearchBot(request)) {
      return new NextResponse(null, { status: 404 })
    }

    // For regular users: redirect to login with callback
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
