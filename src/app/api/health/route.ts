import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected, resetDbConnectionStatus } from '@/lib/db'

export async function GET() {
  const dbConnected = await isDatabaseConnected()

  if (!dbConnected) {
    return NextResponse.json({
      status: 'database_not_configured',
      database: 'disconnected',
      tablesExist: false,
      message: 'Database is not configured. Please set DATABASE_URL environment variable in Vercel Dashboard → Storage → Create Postgres database.',
      timestamp: new Date().toISOString(),
    })
  }

  // Check if the User table exists (indicating schema has been pushed)
  let tablesExist = false
  let schemaError = null
  try {
    await db.user.findFirst({ take: 1 })
    tablesExist = true
  } catch (error: any) {
    schemaError = error?.message?.substring(0, 200) || 'Table does not exist'
    tablesExist = false
  }

  return NextResponse.json({
    status: tablesExist ? 'ok' : 'schema_not_pushed',
    database: 'connected',
    tablesExist,
    schemaError: tablesExist ? null : schemaError,
    message: tablesExist
      ? 'NurseOS API is running, database is connected, and schema is ready.'
      : 'Database is connected but tables do not exist yet. Send a POST request to /api/setup to create the tables, then try again.',
    setupUrl: tablesExist ? null : '/api/setup',
    timestamp: new Date().toISOString(),
  })
}
