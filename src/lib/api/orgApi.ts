import type { Organization } from '@/types'
import { getFromStorage, setToStorage, delay } from './storage'
import { seedOrganization } from './seed'

const STORAGE_KEY = 'organizations'

function getOrganizations(): Organization[] {
  return getFromStorage<Organization[]>(STORAGE_KEY, [seedOrganization])
}

function saveOrganizations(orgs: Organization[]): void {
  setToStorage(STORAGE_KEY, orgs)
}

export const orgApi = {
  async getBySlug(slug: string): Promise<Organization | null> {
    await delay()
    const orgs = getOrganizations()
    return orgs.find((o) => o.slug === slug) ?? null
  },

  async getById(id: string): Promise<Organization | null> {
    await delay()
    const orgs = getOrganizations()
    return orgs.find((o) => o.id === id) ?? null
  },

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    await delay()
    const orgs = getOrganizations()
    const index = orgs.findIndex((o) => o.id === id)
    if (index === -1) {
      throw new Error('Organization not found')
    }
    orgs[index] = {
      ...orgs[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveOrganizations(orgs)
    return orgs[index]
  },

  async getCurrent(): Promise<Organization> {
    await delay()
    const orgs = getOrganizations()
    // For MVP, return the first (only) organization
    return orgs[0]
  },
}
