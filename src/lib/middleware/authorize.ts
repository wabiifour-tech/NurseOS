/**
 * NurseOS authorize() Middleware — v4 Architecture Freeze
 *
 * Pure RBAC layer: checks that the authenticated user's role
 * has the required permissions.
 *
 * This layer does NOT check facilities, ownership, or any context-
 * dependent rules. Those belong in policy().
 */

import type { Middleware, MiddlewareContext, DenialReasonCode } from './types'
import type { Permission } from '@/lib/permissions'
import { roleHasAllPermissions, roleHasAnyPermission, isValidRole } from '@/lib/permissions'
import { denial } from './types'

/**
 * Create an authorize() middleware that checks RBAC permissions.
 *
 * @param requiredAll - User must have ALL these permissions
 * @param requiredAny - User must have AT LEAST ONE of these permissions
 */
export function createAuthorizeMiddleware(opts: {
  requiredAll?: readonly Permission[]
  requiredAny?: readonly Permission[]
}): Middleware {
  return function authorize(ctx: MiddlewareContext): void | Response {
    // Validate role (should already be set by authenticate, but defensive)
    if (!isValidRole(ctx.role)) {
      return denial(
        'INSUFFICIENT_PERMISSIONS',
        `Unknown role: ${ctx.role}. Access denied.`,
        403,
      )
    }

    // Check ALL permissions
    if (opts.requiredAll && opts.requiredAll.length > 0) {
      const missing = opts.requiredAll.filter(p => !ctx.permissions.has(p))
      if (missing.length > 0) {
        return denial(
          'INSUFFICIENT_PERMISSIONS',
          `Insufficient permissions. Required: ${opts.requiredAll.join(', ')}`,
          403,
          { missingPermissions: missing },
        )
      }
    }

    // Check ANY permissions
    if (opts.requiredAny && opts.requiredAny.length > 0) {
      const hasAny = opts.requiredAny.some(p => ctx.permissions.has(p))
      if (!hasAny) {
        return denial(
          'INSUFFICIENT_PERMISSIONS',
          `Insufficient permissions. Need at least one of: ${opts.requiredAny.join(', ')}`,
          403,
          { requiredAnyOf: opts.requiredAny },
        )
      }
    }

    // All checks passed — continue chain
  }
}

/**
 * Shorthand: create authorize() that requires ALL listed permissions.
 */
export function requirePermissions(...perms: Permission[]): Middleware {
  return createAuthorizeMiddleware({ requiredAll: perms })
}

/**
 * Shorthand: create authorize() that requires at least ONE of the listed permissions.
 */
export function requireAnyPermission(...perms: Permission[]): Middleware {
  return createAuthorizeMiddleware({ requiredAny: perms })
}
