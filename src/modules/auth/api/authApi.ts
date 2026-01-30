import type { User } from '../types'
import type { RolePermissions } from '@/modules/database/types'
import type { StaffRole } from '@/modules/database/types'
import { getFromStorage, setToStorage, delay } from '@/modules/database/storage/localStorage'
import { seedUsers } from '@/modules/database/seed/seed'

const USERS_KEY = 'users'
const CURRENT_USER_KEY = 'current_user'

function getUsers(): User[] {
  return getFromStorage<User[]>(USERS_KEY, seedUsers)
}

export const authApi = {
  async login(email: string, _password: string): Promise<User> {
    await delay(300) // Simulate network delay
    const users = getUsers()
    const user = users.find((u) => u.email === email)
    if (!user) {
      throw new Error('Invalid email or password')
    }
    // Mock authentication - in real app, verify password
    setToStorage(CURRENT_USER_KEY, user)
    return user
  },

  async logout(): Promise<void> {
    await delay()
    setToStorage(CURRENT_USER_KEY, null)
  },

  async getCurrentUser(): Promise<User | null> {
    await delay()
    return getFromStorage<User | null>(CURRENT_USER_KEY, null)
  },

  async getUsers(): Promise<User[]> {
    await delay()
    return getUsers()
  },

  async getUserById(id: string): Promise<User | null> {
    await delay()
    const users = getUsers()
    return users.find((u) => u.id === id) ?? null
  },

  async getGroomers(): Promise<User[]> {
    await delay()
    const users = getUsers()
    return users.filter((u) => u.role === 'groomer' || u.role === 'admin' || u.role === 'owner')
  },

  async updateUserPermissions(
    userId: string,
    updates: { role?: StaffRole; permissionOverrides?: Partial<RolePermissions> }
  ): Promise<User> {
    await delay()
    const users = getUsers()
    const index = users.findIndex((u) => u.id === userId)
    if (index === -1) throw new Error('User not found')

    users[index] = {
      ...users[index],
      ...(updates.role !== undefined && { role: updates.role }),
      permissionOverrides: updates.permissionOverrides,
    }
    setToStorage(USERS_KEY, users)

    // If this is the current user, update their session too
    const currentUser = getFromStorage<User | null>(CURRENT_USER_KEY, null)
    if (currentUser?.id === userId) {
      setToStorage(CURRENT_USER_KEY, users[index])
    }

    return users[index]
  },
}
