import type { Groomer } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'

const STORAGE_KEY = 'groomers'

// Seed data for groomers
const seedGroomers: Groomer[] = [
  {
    id: 'groomer-1',
    organizationId: 'org-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@pawfectcuts.com',
    phone: '555-0101',
    specialties: ['Large Dogs', 'Poodle Cuts', 'Dematting'],
    imageUrl: undefined,
    isActive: true,
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'groomer-2',
    organizationId: 'org-1',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike@pawfectcuts.com',
    phone: '555-0102',
    specialties: ['Cats', 'Small Dogs', 'Nail Trimming'],
    imageUrl: undefined,
    isActive: true,
    role: 'groomer',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'groomer-3',
    organizationId: 'org-1',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    email: 'emma@pawfectcuts.com',
    phone: '555-0103',
    specialties: ['Show Cuts', 'Breed-Specific Styles', 'Puppy Grooming'],
    imageUrl: undefined,
    isActive: false,
    role: 'groomer',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
]

function getGroomers(): Groomer[] {
  return getFromStorage<Groomer[]>(STORAGE_KEY, seedGroomers)
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
