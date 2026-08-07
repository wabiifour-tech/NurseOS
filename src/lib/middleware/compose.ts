/**
 * NurseOS Middleware Composition — v4 Architecture Freeze
 *
 * Provides `withAuth()` — the primary API for route authors.
 * Composes the full middleware chain and returns a typed handler.
 *
 * Chain order:
 *   1. authenticate (resolve session → AuthUser)
 *   2. scopeFacility (resolve facilityId on context)
 *   3. authorize (RBAC — role → permissions check)
 *   4. plugin (extension point — currently no-op)
 *   5. policy (ABAC — facility, ownership, etc.)
 *   6. audit (record action metadata)
 *   7. handler (the actual route logic)
 */

import type { NextRequest, NextResponse } from 'next/server'
import type { Middleware, MiddlewareContext, AuthenticatedHandler, AuthConfig } from './types'
import type { Role, Permission } from '@/lib/permissions'
import { getAuthenticatedUser, unauthorizedResponse, type AuthUser } from '@/lib/auth'
import { isValidRole, getRolePermissions } from '@/lib/permissions'
import { denial } from './types'
import { createAuthorizeMiddleware } from './authorize'
import { createPolicyMiddleware } from './policy'
import { createPluginMiddleware, ACTIVE_PLUGINS } from './plugin'
import { createAuditMiddleware, writeAuditLog } from './audit'
import { scopeFacility } from './scopeFacility'

// ─── Compose Middleware ───────────────────────────────────────────────────────

/**
 * Run an array of middleware functions in sequence.
 * Stops on first non-void return (short-circuits with that Response).
 * Returns the final handler's Response if all middleware pass.
 */
async function composeMiddleware(
  middlewares: Middleware[],
  handler: AuthenticatedHandler,
  ctx: MiddlewareContext,
): Promise<Response> {
  for (const mw of middlewares) {
    const result = await mw(ctx)
    if (result instanceof Response) return result
  }
  return handler(ctx)
}

// ─── withAuth() Factory ───────────────────────────────────────────────────────

/**
 * Route-specific overrides for auth config.
 * Each HTTP method can have its own permissions and policies.
 */
export interface MethodAuthConfig {
  permissions?: readonly Permission[]
  permissionsAny?: readonly Permission[]
  policies?: AuthConfig['policies']
}
export interface WithAuthOptions {
  /** Permissions required for ALL methods (can be overridden per-method) */
  permissions?: readonly Permission[]

  /** Permissions required (any-of) for ALL methods */
  permissionsAny?: readonly Permission[]

  /** Policy checks for ALL methods */
  policies?: AuthConfig['policies']

  /** Audit action name (e.g., 'patient.list') */
  auditAction?: string

  /** Audit resource type */
  auditResource?: string

  /** Audit severity */
  auditSeverity?: AuthConfig['auditSeverity']

  /** Per-method overrides. Keys: GET, POST, PATCH, PUT, DELETE */
  methods?: Partial<Record<string, MethodAuthConfig>>

  /** Plugins to run (default: ACTIVE_PLUGINS) */
  plugins?: typeof ACTIVE_PLUGINS

  /** Custom middleware to insert into the chain (runs after authorize, before policy) */
  customMiddleware?: Middleware[]
}

/**
 * Create an authenticated, authorized route handler.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth({
 *   permissions: [CLINICAL_PERMISSIONS.PATIENT_READ],
 *   policies: ['facility_required'],
 *   auditAction: 'patient.list',
 *   auditResource: 'patient',
 * }, async (ctx) => {
 *   const where = facilityWhereClause(ctx)
 *   const patients = await db.patientProfile.findMany({ where })
 *   return Response.json({ patients })
 * })
 * ```
 */
export function withAuth(
  opts: WithAuthOptions,
  handler: AuthenticatedHandler,
): (request: NextRequest) => Promise<Response> {
  return async function authenticatedRoute(request: NextRequest): Promise<Response> {
    const startTime = Date.now()

    // ── Step 1: Authenticate ───────────────────────────────────
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // Resolve role (default to NURSE if unknown — defense in depth)
    const role: Role = isValidRole(authUser.role) ? authUser.role : 'NURSE'
    const permissions = getRolePermissions(role)

    // Detect HTTP method for per-method config
    const method = request.method.toUpperCase()
    const methodConfig = opts.methods?.[method]

    // Merge configs: method-specific overrides base
    const effectivePermissions = methodConfig?.permissions || opts.permissions || []
    const effectivePermissionsAny = methodConfig?.permissionsAny || opts.permissionsAny || []
    const effectivePolicies = methodConfig?.policies || opts.policies || []

    // Build the context
    const ctx: MiddlewareContext = {
      request,
      user: authUser,
      role,
      permissions,
      facilityId: null,       // Will be set by scopeFacility
      isSuperAdmin: false,    // Will be set by scopeFacility
      nurseProfileId: authUser.nurseProfileId,
    }

    // ── Step 2: Build middleware chain ──────────────────────────
    const chain: Middleware[] = [
      // 2a. scopeFacility — resolve facilityId
      scopeFacility,

      // 2b. authorize — RBAC
      createAuthorizeMiddleware({
        requiredAll: effectivePermissions,
        requiredAny: effectivePermissionsAny,
      }),

      // 2c. plugin — extension point
      createPluginMiddleware(opts.plugins || ACTIVE_PLUGINS),

      // 2d. custom middleware (if any)
      ...(opts.customMiddleware || []),

      // 2e. policy — ABAC
      createPolicyMiddleware(effectivePolicies),

      // 2f. audit — record action metadata
      createAuditMiddleware(
        opts.auditAction || 'unknown',
        opts.auditResource || 'unknown',
        opts.auditSeverity || 'INFO',
      ),
    ]

    // ── Step 3: Execute chain + handler ────────────────────────
    let response: Response
    try {
      response = await composeMiddleware(chain, handler, ctx)
    } catch (error) {
      console.error(`[withAuth] Unhandled error in ${opts.auditAction || 'route'}:`, error)
      response = Response.json(
        { error: 'Internal server error' },
        { status: 500 },
      )
    }

    // ── Step 4: Post-handler audit ─────────────────────────────
    const durationMs = Date.now() - startTime

    // If response is a denial (403 with code), enrich audit context
    if (response.status === 403) {
      try {
        const body = await response.clone().json()
        if (ctx.audit && body?.code) {
          ctx.audit.outcome = 'DENY'
          ctx.audit.reasonCode = body.code
        }
      } catch {
        // Response might not be JSON — ignore
      }
    }

    // Write audit log (non-blocking, failures swallowed)
    writeAuditLog(ctx, response, durationMs).catch(() => {})

    return response
  }
}

// ─── Re-export utilities for convenience ──────────────────────────────────────

export { facilityWhereClause, patientFacilityWhere, checkResourceFacility } from './policy'
export { denial, type DenialReasonCode, type PolicyCheck } from './types'
export type { MiddlewareContext, AuthenticatedHandler, AuthConfig } from './types'
