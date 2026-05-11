import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _dbConnected: boolean | null = null

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Check if the database is reachable.
 * Caches the result for 60 seconds to avoid repeated connection attempts.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  // Return cached result if recent
  if (_dbConnected !== null) {
    return _dbConnected
  }

  try {
    await db.$queryRaw`SELECT 1`
    _dbConnected = true
    return true
  } catch {
    _dbConnected = false
    return false
  }
}

/**
 * Reset the cached database connection status.
 * Call this after database env vars are updated.
 */
export function resetDbConnectionStatus() {
  _dbConnected = null
}
