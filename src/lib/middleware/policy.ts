/**
 * NurseOS policy() Middleware — v4 Architecture Freeze
 *
 * ABAC layer: checks context-dependent rules like facility isolation,
 * ownership, nurse profile requirements, etc.
 *
 * This layer runs AFTER authorize() (RBAC) and has access to the
 * full context including resolved permissions.
 */

import type { Middleware, MiddlewareContext } from './types'
import type { PolicyCheck } from './types'
import { denial } from './types'
import { CLINICAL_PERMISSIONS } from '@/lib/permissions'

/**
 * Create a policy() middleware that applies the specified ABAC checks.
 */
export function createPolicyMiddleware(checks: PolicyCheck[]): Middleware {
  return async function policy(ctx: MiddlewareContext): Promise<void | Response> {
    for (const check of checks) {
      const result = await applyPolicyCheck(check, ctx)
      if (result) return result
    }
    // All checks passed
  }
}

async function applyPolicyCheck(
  check: PolicyCheck,
  ctx: MiddlewareContext,
): Promise<void | Response> {
  switch (check) {
    case 'facility_required':
      return checkFacilityRequired(ctx)
    case 'facility_strict':
      return checkFacilityStrict(ctx)
    case 'nurse_profile_required':
      return checkNurseProfileRequired(ctx)
    case 'cross_facility_allowed':
      // Explicit marker — no enforcement, just documentation
      return
    case 'public_resource':
      // No ownership enforcement needed
      return
    case 'ownership_required':
      // Ownership is checked per-resource in the handler, not here.
      // This policy acts as documentation that the handler must verify ownership.
      return
    default:
      // Unknown policy — implementation finding for v5
      console.warn(`[policy] Unknown policy check: ${check}`)
  }
}

/**
 * User must have a facility assignment.
 * SUPER_ADMIN is exempt (they have FACILITY_CROSS_ACCESS permission).
 */
function checkFacilityRequired(ctx: MiddlewareContext): void | Response {
  // SUPER_ADMIN has explicit cross-facility access — no facility needed
  if (ctx.isSuperAdmin) return

  if (!ctx.facilityId) {
    return denial(
      'FACILITY_REQUIRED',
      'You are not assigned to a facility. Please contact your administrator.',
      403,
    )
  }
}

/**
 * User must have a facility assignment. NO exceptions — not even SUPER_ADMIN.
 * Used for operations that are inherently facility-scoped (e.g., facility settings).
 */
function checkFacilityStrict(ctx: MiddlewareContext): void | Response {
  if (!ctx.facilityId) {
    return denial(
      'FACILITY_REQUIRED',
      'A facility assignment is required for this operation.',
      403,
    )
  }
}

/**
 * User must have a NurseProfile. Used for nursing-specific operations.
 */
async function checkNurseProfileRequired(ctx: MiddlewareContext): Promise<void | Response> {
  // If nurseProfileId is already resolved, use it
  if (ctx.nurseProfileId !== null) return

  // Otherwise, we need to resolve it (lazy)
  // Import here to avoid circular dependency
  const { getNurseProfileId } = await import('@/lib/auth')
  const nurseId = await getNurseProfileId(ctx.user.id)
  if (!nurseId) {
    return denial(
      'NURSE_PROFILE_REQUIRED',
      'Only nurses can perform this action.',
      403,
    )
  }
  // Mutate context to cache the resolved ID for downstream use
  ;(ctx as { nurseProfileId: string | null }).nurseProfileId = nurseId
}

// ─── Facility Isolation Helper ────────────────────────────────────────────────

/**
 * Build a Prisma `where` clause for facility-scoped queries.
 * Returns empty object for SUPER_ADMIN (cross-facility access).
 * Returns { facilityId: string } for all other roles.
 *
 * Usage in handlers:
 *   const facilityWhere = facilityWhereClause(ctx)
 *   db.patientProfile.findMany({ where: { ...facilityWhere, ...otherFilters } })
 */
export function facilityWhereClause(
  ctx: MiddlewareContext,
): Record<string, unknown> {
  if (ctx.isSuperAdmin) return {}
  return { facilityId: ctx.facilityId! }
}

/**
 * Build a Prisma `where` clause for nested facility scoping
 * (e.g., records belonging to patients in the facility).
 *
 * Usage:
 *   db.vitalSign.findMany({ where: { patient: { ...patientFacilityWhere(ctx) } } })
 */
export function patientFacilityWhere(
  ctx: MiddlewareContext,
): Record<string, unknown> {
  if (ctx.isSuperAdmin) return {}
  return { facilityId: ctx.facilityId! }
}

/**
 * Check if a resource's facility matches the user's facility.
 * Returns a denial Response if mismatch, void if OK.
 *
 * @param resourceFacilityId - The facility ID of the resource being accessed
 */
export function checkResourceFacility(
  ctx: MiddlewareContext,
  resourceFacilityId: string | null | undefined,
): void | Response {
  if (ctx.isSuperAdmin) return
  if (!resourceFacilityId) return
  if (resourceFacilityId !== ctx.facilityId) {
    return denial(
      'PATIENT_OUTSIDE_FACILITY',
      'You do not have access to this resource. It belongs to a different facility.',
      403,
    )
  }
}
