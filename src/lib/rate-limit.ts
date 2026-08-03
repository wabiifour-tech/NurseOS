/**
 * Distributed rate limiter using Upstash Redis.
 *
 * Why Upstash Redis:
 * - Free tier: 10,000 commands/day, 256 MB storage
 * - Native HTTP API — no persistent TCP connection (perfect for Vercel serverless)
 * - Low latency from edge locations worldwide
 *
 * Falls back to in-memory if UPSTASH_REDIS_REST_URL is not set (dev only).
 * In-memory rate limiting is INEFFECTIVE on Vercel serverless (different instances
 * don't share memory), so UPSTASH_REDIS_REST_URL must be set in production.
 *
 * FAIL-CLOSED: In production, if Redis is not configured, rate limiting
 * returns { limited: true } — the request is blocked. This prevents silent
 * disabling of rate limits due to misconfiguration.
 */

import { Redis } from '@upstash/redis'

// ─── Redis client (singleton per serverless function invocation) ───
let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    redis = new Redis({ url, token })
  }
  return redis
}

// ─── In-memory fallback (dev only — useless on serverless) ───
interface RateLimitEntry {
  count: number
  resetTime: number
}
const memoryStore = new Map<string, RateLimitEntry>()
if (typeof globalThis !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Only run cleanup in dev
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) memoryStore.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests within the window */
  maxRequests: number
}

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis INCR + EXPIRE for atomic distributed counting.
 * Falls back to in-memory if Redis is not configured.
 *
 * Returns { limited: true, retryAfter } if rate limited, or { limited: false } if allowed.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<{ limited: false } | { limited: true; retryAfter: number }> {
  const r = getRedis()
  if (r) {
    return checkRateLimitRedis(r, identifier, options)
  }
  // FAIL-CLOSED: In production, block the request if Redis is not configured.
  // In-memory rate limiting is ineffective on serverless (per-instance isolation).
  if (process.env.NODE_ENV === 'production') {
    console.error('[rate-limit] UPSTASH_REDIS_REST_URL not set in production — blocking request (fail-closed). Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
    return { limited: true, retryAfter: 60 }
  }
  return checkRateLimitMemory(identifier, options)
}

async function checkRateLimitRedis(
  r: Redis,
  identifier: string,
  options: RateLimitOptions
): Promise<{ limited: false } | { limited: true; retryAfter: number }> {
  const key = `rl:${identifier}`
  const windowSec = Math.ceil(options.windowMs / 1000)

  // Atomically increment and set expiry
  const count = await r.incr(key)
  if (count === 1) {
    await r.expire(key, windowSec)
  }

  if (count > options.maxRequests) {
    const ttl = await r.ttl(key)
    const retryAfter = ttl > 0 ? ttl : windowSec
    return { limited: true, retryAfter }
  }

  return { limited: false }
}

function checkRateLimitMemory(
  identifier: string,
  options: RateLimitOptions
): { limited: false } | { limited: true; retryAfter: number } {
  const now = Date.now()
  const entry = memoryStore.get(identifier)
  if (!entry || now > entry.resetTime) {
    memoryStore.set(identifier, { count: 1, resetTime: now + options.windowMs })
    return { limited: false }
  }
  if (entry.count >= options.maxRequests) {
    return { limited: true, retryAfter: Math.ceil((entry.resetTime - now) / 1000) }
  }
  entry.count++
  return { limited: false }
}

/**
 * Get client identifier from request (IP + user agent hash)
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}:${userAgent.slice(0, 50)}`
}

/** Pre-configured rate limits for common auth endpoints */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 minutes
}

export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 login attempts per 15 minutes
}
