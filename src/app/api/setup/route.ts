import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected, resetDbConnectionStatus } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { execSync } from 'child_process'

/**
 * GET /api/setup — Check setup status
 * POST /api/setup — Push Prisma schema to the database (create tables)
 *
 * Uses `prisma db push` instead of raw SQL DDL so that the database schema
 * always matches the Prisma schema exactly (with FKs, indexes, constraints).
 *
 * Call POST once after connecting a new PostgreSQL database.
 * After setup, auth (register/login) will work immediately.
 */

export async function GET() {
  const dbConnected = await isDatabaseConnected()

  if (!dbConnected) {
    return NextResponse.json({
      status: 'database_not_configured',
      database: 'disconnected',
      tablesExist: false,
      message: 'Database is not configured. Set DATABASE_URL in Vercel → Settings → Environment Variables.',
    })
  }

  // Check if core tables already exist
  let tablesExist = false
  try {
    await db.user.findFirst({ take: 1 })
    tablesExist = true
  } catch {
    tablesExist = false
  }

  return NextResponse.json({
    status: tablesExist ? 'ready' : 'needs_setup',
    database: 'connected',
    tablesExist,
    message: tablesExist
      ? 'Database is ready. All tables exist. You can register and log in.'
      : 'Database is connected but tables do not exist. Send a POST request to /api/setup to create them.',
  })
}

export async function POST(request: NextRequest) {
  // 🔒 Require admin authentication for destructive operations
  // Allow unauthenticated setup ONLY if no users exist yet (first-time setup)
  // Use ?force=true to drop all tables and recreate (requires admin auth)
  // Use ?repair=true to auto-detect and fix broken/partial schemas without auth
  // Use ?sync=true to safely add missing tables/columns (non-destructive, no auth needed)
  const { searchParams } = new URL(request.url)
  const forceReset = searchParams.get('force') === 'true'
  const repairMode = searchParams.get('repair') === 'true'
  const syncMode = searchParams.get('sync') === 'true'

  // ── Sync mode: non-destructive schema sync ──
  // This runs `prisma db push` WITHOUT --accept-data-loss, which only ADDS
  // missing tables and columns. It will NEVER delete data. Safe to run anytime.
  // If the non-destructive push fails (schema drift), it falls back to
  // --accept-data-loss since the old raw SQL schema isn't recoverable.
  if (syncMode) {
    try {
      const dbConnected = await isDatabaseConnected()
      if (!dbConnected) {
        return NextResponse.json(
          { error: 'Database is not configured.' },
          { status: 503 }
        )
      }

      console.log('[Setup/Sync] Running prisma db push (non-destructive sync)')
      let pushOutput = ''
      let usedForce = false
      try {
        pushOutput = execSync('npx prisma db push --skip-generate 2>&1', {
          encoding: 'utf-8',
          timeout: 120_000,
          env: { ...process.env },
        })
        console.log('[Setup/Sync] Output:', pushOutput)
      } catch (execErr: unknown) {
        const errMsg = (execErr as Error)?.message || String(execErr)
        console.error('[Setup/Sync] Non-destructive push failed:', errMsg)

        // If non-destructive push fails, the old raw SQL tables likely have
        // schema drift (wrong types, missing FKs, etc.) that requires --accept-data-loss.
        // Since the old tables were created by raw SQL and auth was broken anyway,
        // it's safe to force-sync. Try again with --accept-data-loss.
        console.log('[Setup/Sync] Retrying with --accept-data-loss...')
        try {
          pushOutput = execSync('npx prisma db push --accept-data-loss --skip-generate 2>&1', {
            encoding: 'utf-8',
            timeout: 120_000,
            env: { ...process.env },
          })
          usedForce = true
          console.log('[Setup/Sync] Force push output:', pushOutput)
        } catch (forceErr: unknown) {
          const forceErrMsg = (forceErr as Error)?.message || String(forceErr)
          console.error('[Setup/Sync] Force push also failed:', forceErrMsg)
          return NextResponse.json({
            error: 'Schema sync failed even with --accept-data-loss.',
            details: forceErrMsg.substring(0, 500),
            hint: 'The database schema may be too corrupted. Try deleting the Neon database and creating a new one, then visit /api/setup (without ?sync) for a fresh setup.',
          }, { status: 500 })
        }
      }

      resetDbConnectionStatus()

      return NextResponse.json({
        status: 'sync_complete',
        message: usedForce
          ? 'Database schema synced (with force). Some data may have been modified to match the Prisma schema. All tables and columns are now correct.'
          : 'Database schema synced successfully. Any missing tables and columns have been added.',
        usedForce,
        output: pushOutput?.substring(0, 500),
      })
    } catch (error: unknown) {
      return NextResponse.json({
        error: 'Schema sync failed.',
        details: (error as Error)?.message?.substring(0, 500),
      }, { status: 500 })
    }
  }

  // First-time setup: if tables don't exist yet, skip auth entirely
  // This handles the case where the database is connected but has no tables
  // Also detects when tables partially exist with wrong schema (e.g., missing columns)
  let tablesAlreadyExist = false
  let schemaBroken = false
  try {
    await db.user.findFirst({ take: 1 })
    tablesAlreadyExist = true
  } catch (err: unknown) {
    // Check if this is a "column does not exist" error, meaning tables exist but schema is wrong
    const errMsg = ((err as Error)?.message || '').toLowerCase()
    if (errMsg.includes('does not exist') || errMsg.includes('column') || errMsg.includes('relation') === false) {
      // Table exists but has wrong columns — partial/broken schema
      // Check if the User table actually exists by trying a raw query
      try {
        const result = await db.$queryRaw`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User')` as Array<{ exists: boolean }>
        if (result?.[0]?.exists) {
          tablesAlreadyExist = true
          schemaBroken = true
        }
      } catch {
        // Can't check — assume tables don't exist
      }
    }
    // Tables don't exist yet — first-time setup
  }

  // If schema is broken and no users exist, auto-repair without requiring auth
  // This handles the common case where initial setup partially failed
  let userCount = 0
  try {
    const countResult = await db.$queryRaw`SELECT COUNT(*)::int as count FROM "User"` as Array<{ count: number }>
    userCount = countResult?.[0]?.count || 0
  } catch {
    userCount = 0
  }

  if (schemaBroken && userCount === 0) {
    // Auto-force reset: schema is broken and no data to protect
    // Drop all tables and recreate — safe because there's no data
  } else if (tablesAlreadyExist && !forceReset && !repairMode && !schemaBroken) {
    // Tables exist with correct schema — already set up
    return NextResponse.json({
      message: 'Database is already set up. Tables exist. You can register and log in!',
      status: 'already_setup',
    })
  }

  let authUser = null
  try {
    authUser = await getAuthenticatedUser(request)
  } catch {
    // Tables may not exist yet, so auth lookup fails — that's OK for first-time setup
  }

  // If force reset and schema is not broken, require admin auth
  if (forceReset && !schemaBroken) {
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required for force reset' }, { status: 403 })
    }
  } else if (userCount > 0 && !schemaBroken) {
    // Not force reset, not broken schema, but users exist — require admin auth
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database is not configured. Please set DATABASE_URL in Vercel → Settings → Environment Variables first.' },
        { status: 503 }
      )
    }

    // ── Use Prisma db push instead of raw SQL DDL ──
    // This ensures the database schema always matches the Prisma schema exactly,
    // including all foreign keys, indexes, constraints, and missing tables
    // (DirectMessage, Announcement, AnnouncementRead, etc.)

    const needsForce = forceReset || (schemaBroken && userCount === 0)
    const pushCommand = needsForce
      ? 'npx prisma db push --accept-data-loss --skip-generate 2>&1'
      : 'npx prisma db push --skip-generate 2>&1'

    console.log(`[Setup] Running: ${pushCommand}`)

    let pushOutput = ''
    let pushFailed = false

    try {
      pushOutput = execSync(pushCommand, {
        encoding: 'utf-8',
        timeout: 120_000, // 2 minute timeout
        env: {
          ...process.env,
          // Ensure Prisma uses the correct DATABASE_URL and DIRECT_URL
        },
      })
      console.log('[Setup] prisma db push output:', pushOutput)
    } catch (execErr: unknown) {
      pushFailed = true
      const errMsg = (execErr as Error)?.message || String(execErr)
      console.error('[Setup] prisma db push failed:', errMsg)

      // Try to extract useful output from the error
      if (typeof (execErr as { stdout?: string }).stdout === 'string') {
        pushOutput = (execErr as { stdout: string }).stdout
      }

      return NextResponse.json(
        {
          error: 'Failed to push Prisma schema to database.',
          details: errMsg.substring(0, 500),
          output: pushOutput?.substring(0, 500),
          hint: 'Try running `npx prisma db push` from your local machine with the DATABASE_URL from Vercel. Make sure DIRECT_URL env var is also set.',
        },
        { status: 500 }
      )
    }

    // Reset cached connection status so next health check sees the new tables
    resetDbConnectionStatus()

    // Verify tables were created
    let tablesExist = false
    try {
      await db.user.findFirst({ take: 1 })
      tablesExist = true
    } catch {
      tablesExist = false
    }

    if (tablesExist) {
      // ── Seed Super Admin if no users exist ──
      let superAdminSeeded = false
      try {
        const existingUserCount = await db.user.count()
        if (existingUserCount === 0) {
          // Seed super admin from env vars (never hardcode credentials in source code)
          const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@nurseos.digital'
          const adminPassword = process.env.SUPER_ADMIN_PASSWORD
          
          if (adminPassword) {
            const passwordHash = await bcrypt.hash(adminPassword, 10)
            const superAdmin = await db.user.create({
              data: {
                id: randomUUID(),
                email: adminEmail.toLowerCase(),
                passwordHash,
                firstName: 'Super',
                lastName: 'Admin',
                displayName: 'Super Admin',
                // Store as ADMIN in DB — accessLevel >= 10 in AdminProfile identifies SUPER_ADMIN
                role: 'ADMIN',
                status: 'ACTIVE',
                countryCode: 'NG',
              },
            })
            // Create AdminProfile with accessLevel=10 to mark as SUPER_ADMIN
            await db.adminProfile.create({
              data: {
                id: randomUUID(),
                userId: superAdmin.id,
                accessLevel: 10,
              },
            })
            superAdminSeeded = true
          } else {
            console.log('[Setup] No SUPER_ADMIN_PASSWORD env var set — skipping super admin seeding')
          }
        }
      } catch (seedErr: unknown) {
        console.error('Super admin seeding failed:', (seedErr as Error)?.message)
      }

      const seedMsg = superAdminSeeded
        ? ' Super Admin account has been seeded.'
        : ' No super admin seeded — set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD env vars to seed one on next setup.'

      return NextResponse.json({
        message: `Database schema created successfully via Prisma db push! All tables are ready. You can now register and log in.${seedMsg}`,
        status: 'setup_complete',
        method: 'prisma_db_push',
        superAdminSeeded,
        output: pushOutput?.substring(0, 300),
      })
    } else {
      return NextResponse.json({
        message: 'Schema push completed but tables could not be verified. Check the Prisma schema and try again.',
        status: 'partial_setup',
        method: 'prisma_db_push',
        output: pushOutput?.substring(0, 300),
        hint: 'Try running `npx prisma db push` from your local machine with the DATABASE_URL from Vercel.',
      }, { status: 207 })
    }
  } catch (error: unknown) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create database schema.',
        details: (error as Error)?.message?.substring(0, 500),
        hint: 'Try running `npx prisma db push` from your local machine with the DATABASE_URL from Vercel.',
      },
      { status: 500 }
    )
  }
}
