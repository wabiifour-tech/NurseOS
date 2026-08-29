/**
 * Rate limiter for API routes.
 *
 * Uses an in-memory sliding-window counter per identifier (typically IP).
 * Effective within a single serverless instance (handles burst attacks).
 *
 * NOTE: For true cross-instance distributed rate limiting in production,
 * a dedicated store (Vercel KV, Upstash Redis, or a RateLimitLog table)
 * should be added. The AuditLog model requires a userId foreign key and
 * cannot be used for pre-authentication rate limiting.
 *
 * The key F2 fix is that rate limiting is now ENFORCED on login,
 * forgot-password, and reset-password endpoints (previously missing entirely).
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
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
 * Get client identifier from request (IP-based).
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

/**
 * Check if a request should be rate limited.
 *
 * Returns { limited: true, retryAfter } if rate limited,
 * or { limited: false } if allowed.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions,
): Promise<{ limited: false } | { limited: true; retryAfter: number }> {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    // First request or window expired — start new window
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

/** Pre-configured rate limits for common auth endpoints */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
}

export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
}
