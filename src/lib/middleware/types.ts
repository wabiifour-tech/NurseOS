/**
 * NurseOS Middleware Types — v4 Architecture Freeze
 *
 * Defines the middleware chain context and types.
 * Chain: authenticate() → authorize() → plugin() → policy() → audit() → scopeFacility() → handler
 */

import type { AuthUser } from '@/lib/auth'
import type { Permission, Role } from '@/lib/permissions'
import type { NextRequest } from 'next/server'

// ─── Middleware Context ───────────────────────────────────────────────────────

/**
 * Immutable context passed through the middleware chain.
 * Each middleware layer adds its own data to the context.
 * Handlers receive the fully-populated context.
 */
export interface MiddlewareContext {
  /** The raw Next.js request */
  request: NextRequest

  /** Authenticated user (set by authenticate()) */
  user: AuthUser

  /** Resolved role (set by authenticate(), guaranteed valid Role) */
  role: Role

  /** User's full permission set (set by authorize()) */
  permissions: ReadonlySet<Permission>

  /** Facility ID for scoping (set by scopeFacility()) */
  facilityId: string | null

  /** Whether user is SUPER_ADMIN with cross-facility access */
  isSuperAdmin: boolean

  /** Resolved nurse profile ID (lazy, set by policy() when needed) */
  nurseProfileId: string | null

  /** Audit metadata (set by audit()) */
  audit?: {
    severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
    action: string
    resource: string
    outcome: 'ALLOW' | 'DENY'
    reasonCode?: string
    details?: Record<string, unknown>
  }
}

// ─── Middleware Functions ─────────────────────────────────────────────────────

/**
 * A middleware function that processes the context and either:
 * - Returns void to continue the chain
 * - Returns a Response to short-circuit (deny/redirect)
 */
export type Middleware = (
  ctx: MiddlewareContext,
) => void | Response | Promise<void | Response>

/**
 * A route handler that receives the fully-populated context.
 */
export type AuthenticatedHandler = (
  ctx: MiddlewareContext,
) => Response | Promise<Response>

// ─── Authorization Configuration ──────────────────────────────────────────────

/** Predefined policy checks for common ABAC scenarios */
export type PolicyCheck =
  | 'facility_required'       // User must have a facility (SUPER_ADMIN exempt)
  | 'facility_strict'         // User must have a facility (NO exceptions)
  | 'ownership_required'      // Resource must be owned by user (set in handler)
  | 'nurse_profile_required'  // User must have a NurseProfile
  | 'cross_facility_allowed'  // Explicitly allow cross-facility access (CareGrid)
  | 'public_resource'        // Resource is publicly accessible (no ownership check)

/**
 * Configuration for the authorization middleware chain.
 * This is what route authors provide to define their route's security requirements.
 */
export interface AuthConfig {
  /** Required permissions — user must have ALL of these (RBAC) */
  permissions?: readonly Permission[]

  /** Required permissions — user must have ANY of these (RBAC) */
  permissionsAny?: readonly Permission[]

  /** Policy checks to apply (ABAC) */
  policies?: PolicyCheck[]

  /** Audit severity for this route */
  auditSeverity?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'

  /** Audit action name (e.g., 'patient.list', 'consultation.create') */
  auditAction?: string

  /** Audit resource type (e.g., 'patient', 'consultation') */
  auditResource?: string
}

// ─── Denial Response ──────────────────────────────────────────────────────────

/** Machine-readable reason codes for authorization denials */
export type DenialReasonCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'FACILITY_REQUIRED'
  | 'PATIENT_OUTSIDE_FACILITY'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_OWNERSHIP_REQUIRED'
  | 'NURSE_PROFILE_REQUIRED'
  | 'CONSULTATION_COMPLETED'
  | 'CONSULTATION_NOT_PARTICIPANT'
  | 'MAINTENANCE_MODE'
  | 'FEATURE_DISABLED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'RATE_LIMITED'

/** Structured denial response body */
export interface DenialResponse {
  error: string
  code: DenialReasonCode
  required?: string[]
  details?: Record<string, unknown>
}

/**
 * Create a denial Response with a machine-readable reason code.
 */
export function denial(
  code: DenialReasonCode,
  message: string,
  status: number = 403,
  details?: Record<string, unknown>,
): Response {
  const body: DenialResponse = { error: message, code }
  if (details) body.details = details
  return Response.json(body, { status })
}
