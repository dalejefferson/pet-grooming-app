import type { Groomer } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { seedGroomers } from '../seed/seed'

const STORAGE_KEY = 'groomers'

function getGroomers(): Groomer[] {
  const groomers = getFromStorage<Groomer[]>(STORAGE_KEY, seedGroomers)
  // Backfill userId for groomers missing it (stale localStorage from before seed refactor)
  let changed = false
  for (const g of groomers) {
    if (!g.userId) {
      // Try to match by name against seed data
      const match = seedGroomers.find(
        (s) => s.firstName === g.firstName && s.lastName === g.lastName
      )
      if (match?.userId) {
        g.userId = match.userId
        changed = true
      }
    }
  }
  if (changed) {
    saveGroomers(groomers)
  }
  return groomers
}

function saveGroomers(groomers: Groomer[]): void {
  setToStorage(STORAGE_KEY, groomers)
}

export const groomersApi = {
  async getAll(organizationId?: string): Promise<Groomer[]> {
    await delay()
    const groomers = getGroomers()
    if (organizationId) {
      return groomers.filter((g) => g.organizationId === organizationId)
    }
    return groomers
  },

  async getById(id: string): Promise<Groomer | null> {
    await delay()
    const groomers = getGroomers()
    return groomers.find((g) => g.id === id) ?? null
  },

  async create(data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Groomer> {
    await delay()
    const groomers = getGroomers()
    const now = new Date().toISOString()
    const newGroomer: Groomer = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    groomers.push(newGroomer)
    saveGroomers(groomers)
    return newGroomer
  },

  async update(id: string, data: Partial<Groomer>): Promise<Groomer> {
    await delay()
    const groomers = getGroomers()
    const index = groomers.findIndex((g) => g.id === id)
    if (index === -1) {
      throw new Error('Groomer not found')
    }
    groomers[index] = {
      ...groomers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveGroomers(groomers)
    return groomers[index]
  },

  async delete(id: string): Promise<void> {
    await delay()
    const groomers = getGroomers()
    const filtered = groomers.filter((g) => g.id !== id)
    saveGroomers(filtered)
  },
}
