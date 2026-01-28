import type { Client } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { seedClients } from '../seed/seed'

const STORAGE_KEY = 'clients'

function getClients(): Client[] {
  return getFromStorage<Client[]>(STORAGE_KEY, seedClients)
}

function saveClients(clients: Client[]): void {
  setToStorage(STORAGE_KEY, clients)
}

export const clientsApi = {
  async getAll(organizationId?: string): Promise<Client[]> {
    await delay()
    const clients = getClients()
    if (organizationId) {
      return clients.filter((c) => c.organizationId === organizationId)
    }
    return clients
  },

  async getById(id: string): Promise<Client | null> {
    await delay()
    const clients = getClients()
    return clients.find((c) => c.id === id) ?? null
  },

  async getByEmail(email: string): Promise<Client | null> {
    await delay()
    const clients = getClients()
    return clients.find((c) => c.email === email) ?? null
  },

  async search(query: string, organizationId?: string): Promise<Client[]> {
    await delay()
    const clients = getClients()
    const lowerQuery = query.toLowerCase()
    return clients.filter((c) => {
      if (organizationId && c.organizationId !== organizationId) return false
      return (
        c.firstName.toLowerCase().includes(lowerQuery) ||
        c.lastName.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query)
      )
    })
  },

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    await delay()
    const clients = getClients()
    const now = new Date().toISOString()
    const newClient: Client = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    clients.push(newClient)
    saveClients(clients)
    return newClient
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    await delay()
    const clients = getClients()
    const index = clients.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new Error('Client not found')
    }
    clients[index] = {
      ...clients[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveClients(clients)
    return clients[index]
  },

  async delete(id: string): Promise<void> {
    await delay()
    const clients = getClients()
    const filtered = clients.filter((c) => c.id !== id)
    saveClients(filtered)
  },
}
