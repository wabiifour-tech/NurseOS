import { NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'

/**
 * GET /api/auth/setup-status — Check if the database is set up and ready for auth
 *
 * Returns setup status information so the frontend can show helpful messages
 * instead of cryptic errors when the database isn't configured yet.
 *
 * This route is always public (no auth required) since it's needed before
 * the user can even log in.
 */
export async function GET() {
  try {
    // Check if database is connected
    const dbConnected = await isDatabaseConnected()

    if (!dbConnected) {
      return NextResponse.json({
        setupComplete: false,
        database: 'disconnected',
        canRegister: false,
        canLogin: false,
        message: 'Database is not configured. Set DATABASE_URL in your environment variables.',
        action: 'Please configure the DATABASE_URL and DIRECT_URL environment variables, then visit /api/setup to create tables.',
      })
    }

    // Check if core tables exist by trying to query the User table
    let tablesExist = false
    let userCount = 0

    try {
      await db.user.findFirst({ take: 1 })
      tablesExist = true

      // Count users to know if this is a fresh install
      try {
        userCount = await db.user.count()
      } catch {
        userCount = 0
      }
    } catch {
      tablesExist = false
    }

    if (!tablesExist) {
      return NextResponse.json({
        setupComplete: false,
        database: 'connected',
        canRegister: false,
        canLogin: false,
        message: 'Database is connected but tables do not exist yet.',
        action: 'Send a POST request to /api/setup to create all database tables.',
      })
    }

    // Check if Google OAuth is configured
    const googleOAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    const nextauthConfigured = !!process.env.NEXTAUTH_SECRET

    return NextResponse.json({
      setupComplete: true,
      database: 'connected',
      tablesExist: true,
      canRegister: true,
      canLogin: true,
      userCount,
      googleOAuthConfigured,
      nextauthConfigured,
      message: userCount === 0
        ? 'Database is ready but has no users. Send a POST to /api/setup to seed the super admin, or register a new account.'
        : 'Database is ready. You can register and log in.',
      warnings: [
        !googleOAuthConfigured ? 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign-in.' : null,
        !nextauthConfigured ? 'NEXTAUTH_SECRET is not set. Set it for secure session handling.' : null,
      ].filter(Boolean),
    })
  } catch (error) {
    console.error('[SetupStatus] Error checking setup status:', error)
    return NextResponse.json({
      setupComplete: false,
      database: 'error',
      canRegister: false,
      canLogin: false,
      message: 'Failed to check database setup status.',
      error: (error as Error)?.message?.substring(0, 200),
    }, { status: 500 })
  }
}
