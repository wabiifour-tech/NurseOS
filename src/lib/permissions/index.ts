/**
 * NurseOS Permissions Module — v4 Architecture Freeze
 * 
 * Public API for the permission system.
 * All permission and role operations go through this module.
 */

// Registry
export {
  SYSTEM_PERMISSIONS,
  CLINICAL_PERMISSIONS,
  ACADEMIC_PERMISSIONS,
  ADMIN_PERMISSIONS,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  PERMISSION_CATALOG,
  type Permission,
  type PermissionMetadata,
  isValidPermission,
  findInvalidPermissions,
} from './registry'

// Roles
export {
  type Role,
  ROLE_HIERARCHY,
  getParentRole,
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  getRolePermissions,
  getRoleExclusivePermissions,
  isValidRole,
  invalidatePermissionCache,
} from './roles'
