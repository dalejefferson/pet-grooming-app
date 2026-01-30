import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { LoadingPage } from '@/modules/ui/components/common/LoadingSpinner'
import type { RolePermissions } from '@/types'

export interface ProtectedRouteProps {
  /** Single permission required to access this route */
  permission?: keyof RolePermissions
  /** Multiple permissions to check */
  permissions?: (keyof RolePermissions)[]
  /** If true, requires all permissions; if false, requires any (default: false) */
  requireAll?: boolean
  /** Content to render if authorized */
  children: ReactNode
}

/**
 * Route guard that redirects unauthorized users.
 * - Not logged in -> redirects to /login
 * - Logged in but missing permission -> redirects to /app/dashboard
 */
export function ProtectedRoute({
  permission,
  permissions,
  requireAll = false,
  children,
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, currentUser } = usePermissions()

  if (isLoading) {
    return <LoadingPage />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // If no specific permission required, just need authentication
  if (!permission && (!permissions || permissions.length === 0)) {
    return <>{children}</>
  }

  let hasAccess = false
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  if (!hasAccess) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
