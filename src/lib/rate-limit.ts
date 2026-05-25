/**
 * Simple in-memory rate limiter for API routes.
 * Note: In serverless environments (Vercel), each function invocation may
 * run in a separate container, making this less effective. For production,
 * consider using Vercel KV or Redis for distributed rate limiting.
 */

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
 * Check if a request should be rate limited.
 * Returns { limited: true, retryAfter } if rate limited, or { limited: false } if allowed.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { limited: false } | { limited: true; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    store.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return { limited: false }
  }

  if (entry.count >= options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { limited: true, retryAfter }
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
