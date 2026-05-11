import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConnected } from '@/lib/db'

export async function GET() {
  const dbConnected = await isDatabaseConnected()

  return NextResponse.json({
    status: dbConnected ? 'ok' : 'database_not_configured',
    database: dbConnected ? 'connected' : 'disconnected',
    message: dbConnected
      ? 'NurseOS API is running and database is connected.'
      : 'Database is not configured. Please set DATABASE_URL environment variable in Vercel Dashboard → Storage → Create Postgres database.',
    timestamp: new Date().toISOString(),
  })
}
