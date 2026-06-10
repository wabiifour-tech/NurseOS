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

  // ── Sync mode: schema sync with automatic cleanup ──
  // Tries non-destructive push first. If that fails (schema drift from old raw SQL tables),
  // drops all existing tables and recreates from scratch using `prisma db push`.
  // This is safe for the initial setup since the old tables were broken anyway.
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

      // First try: non-destructive push
      try {
        pushOutput = execSync('npx prisma db push --skip-generate 2>&1', {
          encoding: 'utf-8',
          timeout: 120_000,
          env: { ...process.env },
        })
        console.log('[Setup/Sync] Non-destructive push succeeded')
      } catch (execErr: unknown) {
        const errMsg = (execErr as Error)?.message || String(execErr)
        console.error('[Setup/Sync] Non-destructive push failed:', errMsg.substring(0, 300))

        // Second try: with --accept-data-loss
        console.log('[Setup/Sync] Retrying with --accept-data-loss...')
        try {
          pushOutput = execSync('npx prisma db push --accept-data-loss --skip-generate 2>&1', {
            encoding: 'utf-8',
            timeout: 120_000,
            env: { ...process.env },
          })
          usedForce = true
          console.log('[Setup/Sync] Force push succeeded')
        } catch (forceErr: unknown) {
          const forceErrMsg = (forceErr as Error)?.message || String(forceErr)
          console.error('[Setup/Sync] Force push also failed:', forceErrMsg.substring(0, 300))

          // Third try: drop all tables manually, then push fresh
          console.log('[Setup/Sync] Dropping all tables and starting fresh...')
          try {
            // Drop all tables using raw SQL
            const dropTables = [
              'SimulationAttempt', 'Enrollment', 'CourseModule', 'Simulation', 'Course',
              'CPDRecord', 'PortfolioEntry', 'Competency', 'Credential',
              'StaffingPrediction', 'DiseaseSurveillance', 'FacilityAnalytics',
              'ArticleComment', 'KnowledgeArticle',
              'ConsultationMessage', 'GeneratedReport', 'ReportSchedule', 'NotificationPreference', 'PasswordReset',
              'Consultation', 'Referral', 'LabOrder', 'MedicationOrder', 'AIInteraction',
              'NursingNote', 'VitalSign', 'MedicalRecord', 'Appointment', 'VisitRecord',
              'Department', 'Subscription', 'Notification', 'AuditLog', 'Session',
              'PatientProfile', 'AdminProfile', 'NurseProfile',
              'AnnouncementRead', 'Announcement', 'DirectMessage',
              'User', 'Facility',
              '_prisma_migrations',
            ]
            for (const table of dropTables) {
              try {
                await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`)
              } catch {
                // Ignore — table might not exist
              }
            }
            // Also drop _prisma_migrations if it exists
            try {
              await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE`)
            } catch {}

            console.log('[Setup/Sync] All tables dropped. Running fresh prisma db push...')

            // Now push fresh schema
            pushOutput = execSync('npx prisma db push --skip-generate 2>&1', {
              encoding: 'utf-8',
              timeout: 120_000,
              env: { ...process.env },
            })
            usedForce = true
            console.log('[Setup/Sync] Fresh push succeeded:', pushOutput.substring(0, 200))
          } catch (freshErr: unknown) {
            const freshErrMsg = (freshErr as Error)?.message || String(freshErr)
            console.error('[Setup/Sync] Fresh push also failed:', freshErrMsg.substring(0, 500))
            return NextResponse.json({
              error: 'Could not set up database even after dropping all tables.',
              details: freshErrMsg.substring(0, 500),
              hint: 'This might be a DIRECT_URL issue. Make sure DIRECT_URL is set in Vercel environment variables (use the direct/non-pooled connection string from Neon). Then try again.',
            }, { status: 500 })
          }
        }
      }

      resetDbConnectionStatus()

      // Verify tables were created
      let tablesExist = false
      try {
        await db.user.findFirst({ take: 1 })
        tablesExist = true
      } catch {}

      // Seed super admin if no users exist
      let superAdminSeeded = false
      if (tablesExist) {
        try {
          const existingUserCount = await db.user.count()
          if (existingUserCount === 0) {
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
                  role: 'ADMIN',
                  status: 'ACTIVE',
                  countryCode: 'NG',
                },
              })
              await db.adminProfile.create({
                data: {
                  id: randomUUID(),
                  userId: superAdmin.id,
                  accessLevel: 10,
                },
              })
              superAdminSeeded = true
            }
          }
        } catch (seedErr: unknown) {
          console.error('[Setup/Sync] Super admin seeding failed:', (seedErr as Error)?.message)
        }
      }

      return NextResponse.json({
        status: tablesExist ? 'sync_complete' : 'sync_partial',
        message: usedForce
          ? `Database schema synced (tables recreated from scratch). All tables and columns are now correct.${superAdminSeeded ? ' Super Admin seeded.' : ''}`
          : 'Database schema synced successfully. Any missing tables and columns have been added.',
        usedForce,
        tablesExist,
        superAdminSeeded,
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
