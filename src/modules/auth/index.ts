// Auth module barrel export
export { authApi } from './api'
export { useCurrentUser, useUsers, useLogin, useLogout, usePermissions } from './hooks'
export type { UsePermissionsReturn } from './hooks'
export { PermissionGate } from './components'
export type { PermissionGateProps } from './components'
export { LoginPage } from './pages'
export type { User } from './types'
export { hasRole, isAdmin, isGroomer } from './utils'
