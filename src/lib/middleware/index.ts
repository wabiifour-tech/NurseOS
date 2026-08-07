/**
 * NurseOS Middleware Module — v4 Architecture Freeze
 * 
 * Public API for the authorization middleware chain.
 * Route authors should use `withAuth()` as their primary interface.
 */

export { withAuth } from './compose'
export type { WithAuthOptions, MethodAuthConfig } from './compose'

export { requirePermissions, requireAnyPermission } from './authorize'

export {
  facilityWhereClause,
  patientFacilityWhere,
  checkResourceFacility,
  createPolicyMiddleware,
} from './policy'

export { createAuditMiddleware, writeAuditLog } from './audit'
export { createPluginMiddleware, ACTIVE_PLUGINS } from './plugin'
export type { Plugin } from './plugin'

export { scopeFacility } from './scopeFacility'

export type {
  Middleware,
  MiddlewareContext,
  AuthenticatedHandler,
  AuthConfig,
  PolicyCheck,
  DenialReasonCode,
  DenialResponse,
} from './types'

export { denial } from './types'
