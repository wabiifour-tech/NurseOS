/**
 * NurseOS Role-Permission Mapping — v4 Architecture Freeze
 *
 * Defines which permissions each role has.
 * Inheritance chain: SUPER_ADMIN > ADMIN > DOCTOR > NURSE
 * Each role inherits all permissions from the role below it.
 *
 * INVARIANT (INV-IV): Single-parent inheritance only.
 * INVARIANT (INV-III): No wildcards — SUPER_ADMIN has explicit permissions.
 * INVARIANT (INV-V): Role strings match DB `User.role` values exactly.
 */

import {
  SYSTEM_PERMISSIONS,
  CLINICAL_PERMISSIONS,
  ACADEMIC_PERMISSIONS,
  ADMIN_PERMISSIONS,
  PERMISSION_GROUPS,
  type Permission,
} from './registry'

// ─── Role Type ────────────────────────────────────────────────────────────────

/** All valid roles in the system — matches DB User.role values */
export type Role = 'PATIENT' | 'NURSE' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN'

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

/**
 * Inheritance chain: each role inherits from the one to its right.
 * PATIENT < NURSE < DOCTOR < ADMIN < SUPER_ADMIN
 * PATIENT has no inherited permissions (leaf node).
 */
export const ROLE_HIERARCHY: readonly Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'PATIENT',
] as const

/**
 * Get the parent role in the inheritance chain.
 * Returns null for PATIENT (leaf node).
 */
export function getParentRole(role: Role): Role | null {
  const idx = ROLE_HIERARCHY.indexOf(role)
  if (idx < 0 || idx >= ROLE_HIERARCHY.length - 1) return null
  return ROLE_HIERARCHY[idx + 1]
}

// ─── Role → Permission Mapping ───────────────────────────────────────────────

/**
 * Base permissions for each role (WITHOUT inheritance).
 * The full permission set for a role = its own permissions + all inherited permissions.
 */
const ROLE_BASE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  PATIENT: [],

  NURSE: [
    // Clinical: read-only + write for own documentation
    CLINICAL_PERMISSIONS.PATIENT_READ,
    CLINICAL_PERMISSIONS.PATIENT_WRITE,
    CLINICAL_PERMISSIONS.RECORD_READ,
    CLINICAL_PERMISSIONS.RECORD_WRITE,
    CLINICAL_PERMISSIONS.VITAL_READ,
    CLINICAL_PERMISSIONS.VITAL_WRITE,
    CLINICAL_PERMISSIONS.NOTE_READ,
    CLINICAL_PERMISSIONS.NOTE_WRITE,
    CLINICAL_PERMISSIONS.MEDICATION_READ,
    CLINICAL_PERMISSIONS.MEDICATION_WRITE,
    CLINICAL_PERMISSIONS.LAB_READ,
    CLINICAL_PERMISSIONS.LAB_WRITE,
    CLINICAL_PERMISSIONS.APPOINTMENT_READ,
    CLINICAL_PERMISSIONS.APPOINTMENT_WRITE,
    CLINICAL_PERMISSIONS.SURVEILLANCE_READ,
    CLINICAL_PERMISSIONS.SURVEILLANCE_WRITE,
    // Academic: full self-service
    ...PERMISSION_GROUPS.ACADEMIC_LEARN,
    // Admin: view analytics within facility
    ADMIN_PERMISSIONS.ANALYTICS_READ,
  ],

  DOCTOR: [
    // Inherits NURSE base, adds:
    CLINICAL_PERMISSIONS.MEDICATION_VERIFY,
    CLINICAL_PERMISSIONS.RECORD_DELETE,
    // Admin: staff read (doctor can view team)
    ADMIN_PERMISSIONS.STAFF_READ,
  ],

  ADMIN: [
    // Inherits DOCTOR base, adds:
    ADMIN_PERMISSIONS.FACILITY_READ,
    ADMIN_PERMISSIONS.FACILITY_WRITE,
    ADMIN_PERMISSIONS.STAFF_READ,
    ADMIN_PERMISSIONS.STAFF_WRITE,
    ADMIN_PERMISSIONS.ANALYTICS_READ,
    ADMIN_PERMISSIONS.ANALYTICS_WRITE,
    ADMIN_PERMISSIONS.SUBSCRIPTION_READ,
    ADMIN_PERMISSIONS.SUBSCRIPTION_WRITE,
    ADMIN_PERMISSIONS.EMAIL_SEND,
    ADMIN_PERMISSIONS.EMAIL_BROADCAST,
    ACADEMIC_PERMISSIONS.COURSE_WRITE,
    ACADEMIC_PERMISSIONS.COURSE_MANAGE,
  ],

  SUPER_ADMIN: [
    // Inherits ADMIN base, adds:
    SYSTEM_PERMISSIONS.HEALTH_READ,
    SYSTEM_PERMISSIONS.CONFIG_WRITE,
    SYSTEM_PERMISSIONS.FACILITY_CROSS_ACCESS,
    SYSTEM_PERMISSIONS.USER_MANAGE,
    SYSTEM_PERMISSIONS.AUDIT_READ,
    SYSTEM_PERMISSIONS.ANNOUNCEMENT_MANAGE,
    CLINICAL_PERMISSIONS.PATIENT_DELETE,
    ACADEMIC_PERMISSIONS.COURSE_MANAGE,
  ],
}

// ─── Permission Resolution ───────────────────────────────────────────────────

/**
 * Cache: role → full permission set (own + inherited).
 * Built lazily on first access.
 */
let _permissionCache: Map<Role, ReadonlySet<Permission>> | null = null

/**
 * Resolve the full permission set for a role, including all inherited permissions.
 * Uses a cache for performance — call invalidatePermissionCache() if roles change.
 */
function resolveRolePermissions(role: Role): ReadonlySet<Permission> {
  if (!_permissionCache) {
    _permissionCache = new Map()
  }

  const cached = _permissionCache.get(role)
  if (cached) return cached

  const permissions = new Set<Permission>()
  let current: Role | null = role

  // Walk up the inheritance chain, collecting permissions
  while (current) {
    const base = ROLE_BASE_PERMISSIONS[current]
    if (base) {
      for (const p of base) {
        permissions.add(p)
      }
    }
    current = getParentRole(current)
  }

  const frozen = Object.freeze(permissions) as ReadonlySet<Permission>
  _permissionCache.set(role, frozen)
  return frozen
}

/**
 * Invalidate the permission cache.
 * Call this if roles or permissions are modified (should not happen at runtime in v4).
 */
export function invalidatePermissionCache(): void {
  _permissionCache = null
}

/**
 * Check if a role has a specific permission (including inherited).
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return resolveRolePermissions(role).has(permission)
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function roleHasAllPermissions(role: Role, permissions: readonly Permission[]): boolean {
  const set = resolveRolePermissions(role)
  return permissions.every(p => set.has(p))
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function roleHasAnyPermission(role: Role, permissions: readonly Permission[]): boolean {
  const set = resolveRolePermissions(role)
  return permissions.some(p => set.has(p))
}

/**
 * Get the full permission set for a role (including inherited).
 * Returns a frozen ReadonlySet — do not mutate.
 */
export function getRolePermissions(role: Role): ReadonlySet<Permission> {
  return resolveRolePermissions(role)
}

/**
 * Get all permissions that a role has but its parent does not.
 * Useful for admin UI to show "role-specific permissions."
 */
export function getRoleExclusivePermissions(role: Role): ReadonlySet<Permission> {
  const own = resolveRolePermissions(role)
  const parent = getParentRole(role)
  if (!parent) return own
  const parentPerms = resolveRolePermissions(parent)
  return Object.freeze(
    new Set([...own].filter(p => !parentPerms.has(p))) as Set<Permission>
  ) as ReadonlySet<Permission>
}

// ─── Role Validation ──────────────────────────────────────────────────────────

/**
 * Check if a string is a valid Role.
 */
export function isValidRole(role: string): role is Role {
  return (ROLE_HIERARCHY as readonly string[]).includes(role)
}
