// User/Staff types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'groomer' | 'receptionist'
  organizationId: string
  avatar?: string
  createdAt: string
}
