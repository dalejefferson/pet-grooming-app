import type { User } from '@/types'
import { getFromStorage, setToStorage, delay } from './storage'
import { seedUsers } from './seed'

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
    return users.filter((u) => u.role === 'groomer' || u.role === 'admin')
  },
}
