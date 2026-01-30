import { useMemo } from 'react'
import { useCurrentUser } from './useAuth'
import type { User } from '@/types'
import type { RolePermissions } from '@/types'
import { ROLE_PERMISSIONS } from '@/types'

export interface UsePermissionsReturn {
  /** The currently logged in user, or null if not authenticated */
  currentUser: User | null | undefined
  /** Whether the current user data is still loading */
  isLoading: boolean
  /** The permissions object for the current user (role defaults merged with overrides) */
  permissions: RolePermissions | null
  /** Check if user has a specific permission */
  hasPermission: (permission: keyof RolePermissions) => boolean
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: (keyof RolePermissions)[]) => boolean
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: (keyof RolePermissions)[]) => boolean
  /** Whether the current user is an owner */
  isOwner: boolean
  /** Whether the current user is an admin (includes owner) */
  isAdmin: boolean
  /** Whether the current user is a groomer */
  isGroomer: boolean
  /** Whether the current user is a receptionist */
  isReceptionist: boolean
}

/**
 * Resolve effective permissions for any user by merging role defaults with overrides.
 * Owner role always gets full access regardless of overrides.
 */
export function resolvePermissions(user: User): RolePermissions {
  if (user.role === 'owner') {
    return ROLE_PERMISSIONS.owner
  }
  const roleDefaults = ROLE_PERMISSIONS[user.role]
  if (!user.permissionOverrides) {
    return roleDefaults
  }
  return { ...roleDefaults, ...user.permissionOverrides }
}

/**
 * Hook for checking user permissions based on their role and per-user overrides.
 *
 * @example
 * ```tsx
 * const { hasPermission, isAdmin } = usePermissions()
 *
 * if (hasPermission('canManageStaff')) {
 *   // Show staff management UI
 * }
 *
 * if (isAdmin) {
 *   // Show admin-only features
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: currentUser, isLoading } = useCurrentUser()

  const permissions = useMemo<RolePermissions | null>(() => {
    if (!currentUser?.role) {
      return null
    }
    return resolvePermissions(currentUser)
  }, [currentUser])

  const hasPermission = useMemo(() => {
    return (permission: keyof RolePermissions): boolean => {
      if (!permissions) {
        return false
      }
      return permissions[permission] === true
    }
  }, [permissions])

  const hasAnyPermission = useMemo(() => {
    return (permissionList: (keyof RolePermissions)[]): boolean => {
      if (!permissions) {
        return false
      }
      return permissionList.some((permission) => permissions[permission] === true)
    }
  }, [permissions])

  const hasAllPermissions = useMemo(() => {
    return (permissionList: (keyof RolePermissions)[]): boolean => {
      if (!permissions) {
        return false
      }
      return permissionList.every((permission) => permissions[permission] === true)
    }
  }, [permissions])

  const isOwner = currentUser?.role === 'owner'
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner'
  const isGroomer = currentUser?.role === 'groomer'
  const isReceptionist = currentUser?.role === 'receptionist'

  return {
    currentUser,
    isLoading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isAdmin,
    isGroomer,
    isReceptionist,
  }
}
