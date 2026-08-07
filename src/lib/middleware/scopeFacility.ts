/**
 * NurseOS scopeFacility() Middleware — v4 Architecture Freeze
 *
 * Resolves the facility ID for the request context.
 * SUPER_ADMIN: facilityId = null (cross-facility access via explicit permission)
 * Others: facilityId = user's assigned facility
 *
 * This layer does NOT enforce facility isolation — that's policy()'s job.
 * This layer only resolves the value for downstream use.
 */

import type { Middleware, MiddlewareContext } from './types'

export function createScopeFacilityMiddleware(): Middleware {
  return function scopeFacility(ctx: MiddlewareContext): void {
    // SUPER_ADMIN intentionally has no facilityId — they have FACILITY_CROSS_ACCESS
    ctx.facilityId = ctx.user.facilityId
    ctx.isSuperAdmin = ctx.role === 'SUPER_ADMIN'
  }
}

/**
 * Convenience: the singleton scopeFacility middleware.
 * Always use this unless you need custom behavior.
 */
export const scopeFacility = createScopeFacilityMiddleware()
