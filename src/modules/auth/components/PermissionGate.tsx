import type { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import type { RolePermissions } from '@/types'

export interface PermissionGateProps {
  /** Single permission to check */
  permission?: keyof RolePermissions
  /** Multiple permissions to check */
  permissions?: (keyof RolePermissions)[]
  /** If true, requires all permissions; if false, requires any permission (default: false) */
  requireAll?: boolean
  /** Content to render if permission is denied (default: null) */
  fallback?: ReactNode
  /** Content to render if permission is granted */
  children: ReactNode
}

/**
 * Component that conditionally renders children based on user permissions.
 *
 * @example
 * ```tsx
 * // Single permission check
 * <PermissionGate permission="canViewReports">
 *   <ReportsLink />
 * </PermissionGate>
 *
 * // Multiple permissions with ANY logic (default)
 * <PermissionGate permissions={['canManageStaff', 'canManageServices']}>
 *   <AdminPanel />
 * </PermissionGate>
 *
 * // Multiple permissions with ALL logic
 * <PermissionGate
 *   permissions={['canEditCalendar', 'canViewAllAppointments']}
 *   requireAll
 * >
 *   <CalendarAdmin />
 * </PermissionGate>
 *
 * // With fallback content
 * <PermissionGate
 *   permission="canManageStaff"
 *   fallback={<p>You don't have permission to view this section.</p>}
 * >
 *   <StaffManagement />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps): ReactNode {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions()

  // Don't render anything while loading to prevent flash of content
  if (isLoading) {
    return null
  }

  let hasAccess = false

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission)
  }
  // Check multiple permissions
  else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }
  // No permissions specified - render children (allows for flexible composition)
  else {
    hasAccess = true
  }

  if (hasAccess) {
    return children
  }

  return fallback
}
