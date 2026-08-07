/**
 * NurseOS Permission Registry — v4 Architecture Freeze
 *
 * Single source of truth for ALL permissions in the system.
 * Every permission is defined exactly once with full metadata.
 *
 * Permission format: namespace:resource:action
 * Namespaces: system, clinical, academic, admin
 *
 * INVARIANT (INV-I): This file is the ONLY place permissions are defined.
 * INVARIANT (INV-II): Permission strings are immutable (as const).
 * INVARIANT (INV-III): No wildcards — SUPER_ADMIN has an explicit permission list.
 *
 * @since Phase 1 — Initial implementation matching v4 architecture freeze
 */

// ─── Permission String Literals ─────────────────────────────────────────────

/** System namespace — platform-level operations */
export const SYSTEM_PERMISSIONS = {
  /** View platform health/status */
  HEALTH_READ: 'system:health:read',
  /** Manage platform configuration */
  CONFIG_WRITE: 'system:config:write',
  /** Access all facilities cross-tenant */
  FACILITY_CROSS_ACCESS: 'system:facility:cross-access',
  /** Manage user accounts across the platform */
  USER_MANAGE: 'system:users:manage',
  /** View audit logs */
  AUDIT_READ: 'system:audit:read',
  /** Manage announcements platform-wide */
  ANNOUNCEMENT_MANAGE: 'system:announcements:manage',
} as const

/** Clinical namespace — patient care and medical records */
export const CLINICAL_PERMISSIONS = {
  // Patient operations
  PATIENT_READ: 'clinical:patients:read',
  PATIENT_WRITE: 'clinical:patients:write',
  PATIENT_DELETE: 'clinical:patients:delete',

  // Medical records
  RECORD_READ: 'clinical:records:read',
  RECORD_WRITE: 'clinical:records:write',
  RECORD_DELETE: 'clinical:records:delete',

  // Vitals
  VITAL_READ: 'clinical:vitals:read',
  VITAL_WRITE: 'clinical:vitals:write',

  // Nursing notes
  NOTE_READ: 'clinical:notes:read',
  NOTE_WRITE: 'clinical:notes:write',

  // Medication orders
  MEDICATION_READ: 'clinical:medications:read',
  MEDICATION_WRITE: 'clinical:medications:write',
  MEDICATION_VERIFY: 'clinical:medications:verify',

  // Lab orders
  LAB_READ: 'clinical:labs:read',
  LAB_WRITE: 'clinical:labs:write',

  // Appointments
  APPOINTMENT_READ: 'clinical:appointments:read',
  APPOINTMENT_WRITE: 'clinical:appointments:write',

  // Disease surveillance
  SURVEILLANCE_READ: 'clinical:surveillance:read',
  SURVEILLANCE_WRITE: 'clinical:surveillance:write',
} as const

/** Academic namespace — learning, courses, credentials */
export const ACADEMIC_PERMISSIONS = {
  // Course operations
  COURSE_READ: 'academic:courses:read',
  COURSE_WRITE: 'academic:courses:write',
  COURSE_MANAGE: 'academic:courses:manage',

  // Enrollment
  ENROLLMENT_READ: 'academic:enrollments:read',
  ENROLLMENT_WRITE: 'academic:enrollments:write',

  // Simulations
  SIMULATION_READ: 'academic:simulations:read',
  SIMULATION_WRITE: 'academic:simulations:write',

  // Credentials & competencies (NurseID)
  CREDENTIAL_READ: 'academic:credentials:read',
  CREDENTIAL_WRITE: 'academic:credentials:write',
  COMPETENCY_READ: 'academic:competencies:read',
  COMPETENCY_WRITE: 'academic:competencies:write',
  PORTFOLIO_READ: 'academic:portfolio:read',
  PORTFOLIO_WRITE: 'academic:portfolio:write',
  CPD_READ: 'academic:cpd:read',
  CPD_WRITE: 'academic:cpd:write',

  // Course materials
  MATERIAL_READ: 'academic:materials:read',
  MATERIAL_WRITE: 'academic:materials:write',
  MATERIAL_SHARE: 'academic:materials:share',
} as const

/** Admin namespace — facility and staff management */
export const ADMIN_PERMISSIONS = {
  // Facility management
  FACILITY_READ: 'admin:facilities:read',
  FACILITY_WRITE: 'admin:facilities:write',

  // Staff management within facility
  STAFF_READ: 'admin:staff:read',
  STAFF_WRITE: 'admin:staff:write',

  // Analytics & reports
  ANALYTICS_READ: 'admin:analytics:read',
  ANALYTICS_WRITE: 'admin:analytics:write',

  // Subscriptions
  SUBSCRIPTION_READ: 'admin:subscriptions:read',
  SUBSCRIPTION_WRITE: 'admin:subscriptions:write',

  // Email & notifications
  EMAIL_SEND: 'admin:email:send',
  EMAIL_BROADCAST: 'admin:email:broadcast',
} as const

// ─── Permission Groups (Bundles) ─────────────────────────────────────────────

/**
 * Pre-defined permission bundles for common access patterns.
 * These are convenience groupings — roles reference these or individual permissions.
 */
export const PERMISSION_GROUPS = {
  /** Full read access to all clinical data within facility */
  CLINICAL_READ: [
    CLINICAL_PERMISSIONS.PATIENT_READ,
    CLINICAL_PERMISSIONS.RECORD_READ,
    CLINICAL_PERMISSIONS.VITAL_READ,
    CLINICAL_PERMISSIONS.NOTE_READ,
    CLINICAL_PERMISSIONS.MEDICATION_READ,
    CLINICAL_PERMISSIONS.LAB_READ,
    CLINICAL_PERMISSIONS.APPOINTMENT_READ,
    CLINICAL_PERMISSIONS.SURVEILLANCE_READ,
  ] as const,

  /** Write access to clinical data (documentation, vitals entry) */
  CLINICAL_WRITE: [
    CLINICAL_PERMISSIONS.PATIENT_WRITE,
    CLINICAL_PERMISSIONS.RECORD_WRITE,
    CLINICAL_PERMISSIONS.VITAL_WRITE,
    CLINICAL_PERMISSIONS.NOTE_WRITE,
    CLINICAL_PERMISSIONS.MEDICATION_WRITE,
    CLINICAL_PERMISSIONS.LAB_WRITE,
    CLINICAL_PERMISSIONS.APPOINTMENT_WRITE,
    CLINICAL_PERMISSIONS.SURVEILLANCE_WRITE,
  ] as const,

  /** Clinical write + medication verification (doctor-level) */
  CLINICAL_WRITE_WITH_VERIFY: [
    CLINICAL_PERMISSIONS.PATIENT_WRITE,
    CLINICAL_PERMISSIONS.RECORD_WRITE,
    CLINICAL_PERMISSIONS.VITAL_WRITE,
    CLINICAL_PERMISSIONS.NOTE_WRITE,
    CLINICAL_PERMISSIONS.MEDICATION_WRITE,
    CLINICAL_PERMISSIONS.MEDICATION_VERIFY,
    CLINICAL_PERMISSIONS.LAB_WRITE,
    CLINICAL_PERMISSIONS.APPOINTMENT_WRITE,
    CLINICAL_PERMISSIONS.SURVEILLANCE_WRITE,
  ] as const,

  /** Learning and self-development access */
  ACADEMIC_LEARN: [
    ACADEMIC_PERMISSIONS.COURSE_READ,
    ACADEMIC_PERMISSIONS.ENROLLMENT_READ,
    ACADEMIC_PERMISSIONS.ENROLLMENT_WRITE,
    ACADEMIC_PERMISSIONS.SIMULATION_READ,
    ACADEMIC_PERMISSIONS.SIMULATION_WRITE,
    ACADEMIC_PERMISSIONS.CREDENTIAL_READ,
    ACADEMIC_PERMISSIONS.CREDENTIAL_WRITE,
    ACADEMIC_PERMISSIONS.COMPETENCY_READ,
    ACADEMIC_PERMISSIONS.COMPETENCY_WRITE,
    ACADEMIC_PERMISSIONS.PORTFOLIO_READ,
    ACADEMIC_PERMISSIONS.PORTFOLIO_WRITE,
    ACADEMIC_PERMISSIONS.CPD_READ,
    ACADEMIC_PERMISSIONS.CPD_WRITE,
    ACADEMIC_PERMISSIONS.MATERIAL_READ,
    ACADEMIC_PERMISSIONS.MATERIAL_WRITE,
    ACADEMIC_PERMISSIONS.MATERIAL_SHARE,
  ] as const,

  /** CareGrid cross-facility consultation access */
  CAREGRID: [
    CLINICAL_PERMISSIONS.PATIENT_READ,
    CLINICAL_PERMISSIONS.RECORD_READ,
    CLINICAL_PERMISSIONS.NOTE_READ,
    CLINICAL_PERMISSIONS.VITAL_READ,
    CLINICAL_PERMISSIONS.MEDICATION_READ,
  ] as const,
} as const

// ─── Immutable Permission Set ────────────────────────────────────────────────

/**
 * Complete set of all valid permissions in the system.
 * Used for validation — any permission not in this set is invalid.
 *
 * INVARIANT: This set is derived from the above definitions and is immutable.
 */
export const ALL_PERMISSIONS: ReadonlySet<string> = new ReadonlySet([
  ...Object.values(SYSTEM_PERMISSIONS),
  ...Object.values(CLINICAL_PERMISSIONS),
  ...Object.values(ACADEMIC_PERMISSIONS),
  ...Object.values(ADMIN_PERMISSIONS),
])

/**
 * Type alias for a valid permission string.
 * Any string not in ALL_PERMISSIONS is not a valid Permission.
 */
export type Permission = typeof ALL_PERMISSIONS extends ReadonlySet<infer T>
  ? T
  : never

// ─── Permission Metadata ─────────────────────────────────────────────────────

/** Metadata for a single permission */
export interface PermissionMetadata {
  id: string
  namespace: 'system' | 'clinical' | 'academic' | 'admin'
  resource: string
  action: string
  description: string
  introducedIn: string
}

/**
 * Full permission catalog with metadata.
 * Used for documentation, admin UI, and debugging.
 */
export const PERMISSION_CATALOG: readonly PermissionMetadata[] = [
  // System
  { id: SYSTEM_PERMISSIONS.HEALTH_READ, namespace: 'system', resource: 'health', action: 'read', description: 'View platform health and status', introducedIn: 'v4.0' },
  { id: SYSTEM_PERMISSIONS.CONFIG_WRITE, namespace: 'system', resource: 'config', action: 'write', description: 'Manage platform configuration', introducedIn: 'v4.0' },
  { id: SYSTEM_PERMISSIONS.FACILITY_CROSS_ACCESS, namespace: 'system', resource: 'facility', action: 'cross-access', description: 'Access data across all facilities (cross-tenant)', introducedIn: 'v4.0' },
  { id: SYSTEM_PERMISSIONS.USER_MANAGE, namespace: 'system', resource: 'users', action: 'manage', description: 'Manage user accounts across the platform', introducedIn: 'v4.0' },
  { id: SYSTEM_PERMISSIONS.AUDIT_READ, namespace: 'system', resource: 'audit', action: 'read', description: 'View audit logs', introducedIn: 'v4.0' },
  { id: SYSTEM_PERMISSIONS.ANNOUNCEMENT_MANAGE, namespace: 'system', resource: 'announcements', action: 'manage', description: 'Create and manage platform-wide announcements', introducedIn: 'v4.0' },

  // Clinical
  { id: CLINICAL_PERMISSIONS.PATIENT_READ, namespace: 'clinical', resource: 'patients', action: 'read', description: 'View patient profiles and lists', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.PATIENT_WRITE, namespace: 'clinical', resource: 'patients', action: 'write', description: 'Create and edit patient profiles', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.PATIENT_DELETE, namespace: 'clinical', resource: 'patients', action: 'delete', description: 'Delete patient profiles', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.RECORD_READ, namespace: 'clinical', resource: 'records', action: 'read', description: 'View medical records', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.RECORD_WRITE, namespace: 'clinical', resource: 'records', action: 'write', description: 'Create and edit medical records', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.RECORD_DELETE, namespace: 'clinical', resource: 'records', action: 'delete', description: 'Delete medical records', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.VITAL_READ, namespace: 'clinical', resource: 'vitals', action: 'read', description: 'View vital signs', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.VITAL_WRITE, namespace: 'clinical', resource: 'vitals', action: 'write', description: 'Record vital signs', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.NOTE_READ, namespace: 'clinical', resource: 'notes', action: 'read', description: 'View nursing notes', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.NOTE_WRITE, namespace: 'clinical', resource: 'notes', action: 'write', description: 'Create and edit nursing notes', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.MEDICATION_READ, namespace: 'clinical', resource: 'medications', action: 'read', description: 'View medication orders', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.MEDICATION_WRITE, namespace: 'clinical', resource: 'medications', action: 'write', description: 'Create medication orders', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.MEDICATION_VERIFY, namespace: 'clinical', resource: 'medications', action: 'verify', description: 'Verify medication orders (doctor-level)', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.LAB_READ, namespace: 'clinical', resource: 'labs', action: 'read', description: 'View lab orders and results', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.LAB_WRITE, namespace: 'clinical', resource: 'labs', action: 'write', description: 'Create lab orders', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.APPOINTMENT_READ, namespace: 'clinical', resource: 'appointments', action: 'read', description: 'View appointments', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.APPOINTMENT_WRITE, namespace: 'clinical', resource: 'appointments', action: 'write', description: 'Create and manage appointments', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.SURVEILLANCE_READ, namespace: 'clinical', resource: 'surveillance', action: 'read', description: 'View disease surveillance data', introducedIn: 'v4.0' },
  { id: CLINICAL_PERMISSIONS.SURVEILLANCE_WRITE, namespace: 'clinical', resource: 'surveillance', action: 'write', description: 'Report disease surveillance data', introducedIn: 'v4.0' },

  // Academic
  { id: ACADEMIC_PERMISSIONS.COURSE_READ, namespace: 'academic', resource: 'courses', action: 'read', description: 'View courses', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.COURSE_WRITE, namespace: 'academic', resource: 'courses', action: 'write', description: 'Create and edit courses (lecturer)', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.COURSE_MANAGE, namespace: 'academic', resource: 'courses', action: 'manage', description: 'Full course administration', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.ENROLLMENT_READ, namespace: 'academic', resource: 'enrollments', action: 'read', description: 'View enrollments', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.ENROLLMENT_WRITE, namespace: 'academic', resource: 'enrollments', action: 'write', description: 'Enroll in courses', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.SIMULATION_READ, namespace: 'academic', resource: 'simulations', action: 'read', description: 'View simulations', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.SIMULATION_WRITE, namespace: 'academic', resource: 'simulations', action: 'write', description: 'Attempt simulations', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.CREDENTIAL_READ, namespace: 'academic', resource: 'credentials', action: 'read', description: 'View credentials', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.CREDENTIAL_WRITE, namespace: 'academic', resource: 'credentials', action: 'write', description: 'Add and manage credentials', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.COMPETENCY_READ, namespace: 'academic', resource: 'competencies', action: 'read', description: 'View competencies', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.COMPETENCY_WRITE, namespace: 'academic', resource: 'competencies', action: 'write', description: 'Record competencies', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.PORTFOLIO_READ, namespace: 'academic', resource: 'portfolio', action: 'read', description: 'View portfolio entries', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.PORTFOLIO_WRITE, namespace: 'academic', resource: 'portfolio', action: 'write', description: 'Create portfolio entries', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.CPD_READ, namespace: 'academic', resource: 'cpd', action: 'read', description: 'View CPD records', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.CPD_WRITE, namespace: 'academic', resource: 'cpd', action: 'write', description: 'Record CPD activities', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.MATERIAL_READ, namespace: 'academic', resource: 'materials', action: 'read', description: 'View course materials', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.MATERIAL_WRITE, namespace: 'academic', resource: 'materials', action: 'write', description: 'Create and edit course materials', introducedIn: 'v4.0' },
  { id: ACADEMIC_PERMISSIONS.MATERIAL_SHARE, namespace: 'academic', resource: 'materials', action: 'share', description: 'Share course materials', introducedIn: 'v4.0' },

  // Admin
  { id: ADMIN_PERMISSIONS.FACILITY_READ, namespace: 'admin', resource: 'facilities', action: 'read', description: 'View facility details', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.FACILITY_WRITE, namespace: 'admin', resource: 'facilities', action: 'write', description: 'Edit facility settings', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.STAFF_READ, namespace: 'admin', resource: 'staff', action: 'read', description: 'View staff within facility', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.STAFF_WRITE, namespace: 'admin', resource: 'staff', action: 'write', description: 'Manage staff within facility', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.ANALYTICS_READ, namespace: 'admin', resource: 'analytics', action: 'read', description: 'View facility analytics dashboard', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.ANALYTICS_WRITE, namespace: 'admin', resource: 'analytics', action: 'write', description: 'Generate and manage reports', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.SUBSCRIPTION_READ, namespace: 'admin', resource: 'subscriptions', action: 'read', description: 'View subscription details', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.SUBSCRIPTION_WRITE, namespace: 'admin', resource: 'subscriptions', action: 'write', description: 'Manage subscriptions', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.EMAIL_SEND, namespace: 'admin', resource: 'email', action: 'send', description: 'Send individual emails', introducedIn: 'v4.0' },
  { id: ADMIN_PERMISSIONS.EMAIL_BROADCAST, namespace: 'admin', resource: 'email', action: 'broadcast', description: 'Send broadcast emails to facility users', introducedIn: 'v4.0' },
] as const

// ─── Validation Utility ──────────────────────────────────────────────────────

/**
 * Check if a string is a valid, registered permission.
 * Use during development to catch typos in permission strings.
 */
export function isValidPermission(permission: string): permission is Permission {
  return ALL_PERMISSIONS.has(permission)
}

/**
 * Validate an array of permissions, returning invalid ones.
 * Returns empty array if all are valid.
 */
export function findInvalidPermissions(permissions: readonly string[]): string[] {
  return permissions.filter(p => !ALL_PERMISSIONS.has(p))
}
