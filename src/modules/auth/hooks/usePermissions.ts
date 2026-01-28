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
  /** The permissions object for the current user's role */
  permissions: RolePermissions | null
  /** Check if user has a specific permission */
  hasPermission: (permission: keyof RolePermissions) => boolean
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: (keyof RolePermissions)[]) => boolean
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: (keyof RolePermissions)[]) => boolean
  /** Whether the current user is an admin */
  isAdmin: boolean
  /** Whether the current user is a groomer */
  isGroomer: boolean
  /** Whether the current user is a receptionist */
  isReceptionist: boolean
}

/**
 * Hook for checking user permissions based on their role.
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
    return ROLE_PERMISSIONS[currentUser.role]
  }, [currentUser?.role])

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

  const isAdmin = currentUser?.role === 'admin'
  const isGroomer = currentUser?.role === 'groomer'
  const isReceptionist = currentUser?.role === 'receptionist'

  return {
    currentUser,
    isLoading,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isGroomer,
    isReceptionist,
  }
}
