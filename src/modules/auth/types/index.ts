import type { RolePermissions, StaffRole } from '@/modules/database/types'

// User/Staff types
export interface User {
  id: string
  email: string
  name: string
  role: StaffRole
  organizationId: string
  avatar?: string
  createdAt: string
  permissionOverrides?: Partial<RolePermissions>
}
