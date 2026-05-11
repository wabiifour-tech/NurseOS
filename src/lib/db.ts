import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Cache the database connection status with a 60-second TTL
let _dbConnected: boolean | null = null
let _dbConnectedAt: number = 0
const DB_CACHE_TTL = 60_000 // 60 seconds

/**
 * Check if the database is reachable.
 * Caches the result for 60 seconds to avoid repeated connection attempts.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  // Return cached result if recent (within TTL)
  if (_dbConnected !== null && (Date.now() - _dbConnectedAt) < DB_CACHE_TTL) {
    return _dbConnected
  }

  try {
    await db.$queryRaw`SELECT 1`
    _dbConnected = true
    _dbConnectedAt = Date.now()
    return true
  } catch {
    _dbConnected = false
    _dbConnectedAt = Date.now()
    return false
  }
}

/**
 * Reset the cached database connection status.
 * Call this after database env vars are updated or schema is pushed.
 */
export function resetDbConnectionStatus() {
  _dbConnected = null
  _dbConnectedAt = 0
}
