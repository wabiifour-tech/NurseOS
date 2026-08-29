/**
 * Rate limiter for API routes — database-backed for serverless compatibility.
 *
 * Uses a two-layer approach:
 *   1. In-memory Map for fast same-instance checks
 *   2. Database (AuditLog) for cross-instance enforcement in serverless deployments
 *
 * If the database is unavailable, falls back to in-memory only.
 */

import { db } from '@/lib/db'

// ─── In-Memory Layer (fast path for same-instance requests) ─────────────────────

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests within the window */
  maxRequests: number
}

/**
 * Get client identifier from request (IP-based, no user-agent to avoid accidental blocking)
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

/**
 * Get a combined identifier for rate limiting (IP + endpoint context).
 * This prevents one endpoint's rate limit from affecting another.
 */
export function getEndpointRateLimitIdentifier(request: Request, endpoint: string): string {
  const ip = getRateLimitIdentifier(request)
  return `${endpoint}:${ip}`
}

// ─── Database Layer (cross-instance enforcement) ───────────────────────────────

/**
 * Check rate limit against the database (AuditLog table).
 * Counts recent RATE_LIMIT_EVENT entries for the given key.
 * Returns true if rate limited.
 */
async function checkDatabaseRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<{ limited: true; retryAfter: number } | null> {
  try {
    const windowStart = new Date(Date.now() - options.windowMs)

    const count = await db.auditLog.count({
      where: {
        action: 'RATE_LIMIT_EVENT',
        resource: key,
        createdAt: { gte: windowStart },
      },
    })

    if (count >= options.maxRequests) {
      // Find the oldest entry in the window to calculate retryAfter
      const oldest = await db.auditLog.findFirst({
        where: {
          action: 'RATE_LIMIT_EVENT',
          resource: key,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      })

      const retryAfter = oldest
        ? Math.ceil((oldest.createdAt.getTime() + options.windowMs - Date.now()) / 1000)
        : 60

      return { limited: true, retryAfter: Math.max(1, retryAfter) }
    }

    // Record this request in the database
    await db.auditLog.create({
      data: {
        action: 'RATE_LIMIT_EVENT',
        resource: key,
        details: 'Rate limit counter increment',
      },
    })

    return null // Not limited
  } catch {
    // Database unavailable — fall back to in-memory only
    return null
  }
}

/**
 * Clean up old rate limit entries from the database.
 * Called periodically to prevent unlimited growth.
 * Entries older than 1 hour are deleted.
 */
async function cleanupDatabaseRateLimits(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    await db.auditLog.deleteMany({
      where: {
        action: 'RATE_LIMIT_EVENT',
        createdAt: { lt: cutoff },
      },
    })
  } catch {
    // Non-critical — ignore cleanup failures
  }
}

// Run cleanup every 10 minutes
setInterval(() => {
  cleanupDatabaseRateLimits().catch(() => {})
}, 10 * 60 * 1000)

// ─── Main Rate Limit Check ────────────────────────────────────────────────────

/**
 * Check if a request should be rate limited.
 * Uses in-memory check first (fast), then database check (cross-instance).
 *
 * Returns { limited: true, retryAfter } if rate limited,
 * or { limited: false } if allowed.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions,
): Promise<{ limited: false } | { limited: true; retryAfter: number }> {
  const now = Date.now()

  // Layer 1: In-memory check (fast path)
  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    // First request or window expired — set up in-memory counter
    store.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    })
  } else if (entry.count >= options.maxRequests) {
    // In-memory limit hit — calculate retryAfter
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    // Still check database for consistency, but return immediately
    return { limited: true, retryAfter }
  } else {
    entry.count++
  }

  // Layer 2: Database check (cross-instance enforcement)
  // This catches requests that span multiple serverless instances
  const dbResult = await checkDatabaseRateLimit(identifier, options)
  if (dbResult && dbResult.limited) {
    // Sync in-memory state with database
    store.set(identifier, {
      count: options.maxRequests,
      resetTime: now + dbResult.retryAfter * 1000,
    })
    return dbResult
  }

  return { limited: false }
}

/** Pre-configured rate limits for common auth endpoints */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
}

export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
}
