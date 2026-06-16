import { NextRequest, NextResponse } from 'next/server'

/**
 * NurseOS Middleware — Authentication + SEO/Crawler Handling
 *
 * Key design decisions for Google Search Console compliance:
 * 1. Public pages (/, /about, /features, /pricing, /privacy, /terms) are fully
 *    accessible to all visitors including search engine bots — no redirect, no block.
 * 2. Auth pages (/login, /register) are accessible but marked noindex (shouldn't
 *    appear in search results).
 * 3. Protected pages (/dashboard, /nurseai, etc.) — for bots, we serve the page
 *    with X-Robots-Tag: noindex instead of redirecting (which causes "Page with
 *    redirect" in Google Search Console) or returning 404 (which causes "Soft 404").
 * 4. For regular unauthenticated users, protected pages redirect to /login.
 */

// Routes that don't require authentication and SHOULD be indexed by Google
const indexablePublicRoutes = [
  '/',
  '/about',
  '/features',
  '/pricing',
  '/privacy',
  '/terms',
  '/hipaa',
  '/ndpr',
]

// Routes that don't require auth but should NOT be indexed (auth flow pages)
const nonIndexablePublicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
  '/auth/callback',
  '/setup',
  '/test-login',
]

// All public routes combined
const publicRoutes = [...indexablePublicRoutes, ...nonIndexablePublicRoutes, '/sitemap.xml']

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
  '/api/auth/setup-status',
  '/api/auth/dev-login',
  '/api/facilities/public',
  '/api/health',
  '/api/setup',
  '/api/setup/test-accounts',
  '/api/seed',
  '/api/email/webhook',
  '/api/news',
]

// NextAuth.js catch-all route prefix — any request to /api/auth/* must be public
// This covers /api/auth/signin, /api/auth/callback/google, /api/auth/session, etc.
const NEXTAUTH_ROUTE_PREFIX = '/api/auth/'

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

// Normalize a pathname: remove trailing slash (except for root), lowercase
const normalizePath = (pathname: string): string => {
  if (pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

// Check if a path is public (doesn't require auth)
const isPublicPath = (pathname: string): boolean => {
  const normalized = normalizePath(pathname)
  if (publicRoutes.includes(normalized)) return true
  // Also check without normalization for direct match
  if (publicRoutes.includes(pathname)) return true
  // Only allow specifically whitelisted API routes without auth
  if (pathname.startsWith('/api/')) {
    // NextAuth.js catch-all route: any path under /api/auth/* is public
    // This covers /api/auth/signin, /api/auth/callback/google, /api/auth/session, etc.
    if (pathname.startsWith(NEXTAUTH_ROUTE_PREFIX)) return true
    // Other specifically whitelisted API routes
    return publicApiRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  }
  if (pathname.startsWith('/_next/')) return true
  if (pathname.includes('.')) return true // static files
  return false
}

// Paths that should never get a noindex header (technical files)
const neverNoindexPaths = ['/sitemap.xml', '/robots.txt']

// Check if a path should be indexed by search engines (public + indexable)
const isIndexablePath = (pathname: string): boolean => {
  const normalized = normalizePath(pathname)
  return indexablePublicRoutes.includes(normalized) || 
         indexablePublicRoutes.includes(pathname) ||
         neverNoindexPaths.includes(pathname)
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
    'Googlebot-Image', 'Googlebot-News', 'Googlebot-Video',
    'AdsBot-Google', 'Mediapartners-Google',
  ]
  return botPatterns.some(bot => ua.includes(bot))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token in cookies or Authorization header
  const authToken = request.cookies.get('nurseos-token')?.value
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  const isAuthenticated = !!(authToken || bearerToken)

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

    // For search engine bots: let the page render but add noindex header.
    // This prevents "Page with redirect" errors in Google Search Console
    // because we don't redirect the bot — we serve the page content with
    // an instruction not to index it. The client-side auth logic will show
    // a redirect/loading screen, but Google won't flag it as a redirect.
    if (isSearchBot(request)) {
      const response = NextResponse.next()
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return response
    }

    // For regular users: redirect to login with callback
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For public pages that shouldn't be indexed (login, register, etc.)
  // Add noindex header to prevent them from appearing in search results
  // Exception: sitemap.xml and robots.txt are technical files that should NOT get noindex
  if (isPublicPath(pathname) && !isIndexablePath(pathname)) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
