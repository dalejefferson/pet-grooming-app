import type { DeletedItem, DeletedEntityType, Client, Pet, Groomer, Service } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { clientsApi } from './clientsApi'
import { petsApi } from './petsApi'
import { groomersApi } from './groomersApi'
import { servicesApi } from './servicesApi'

const STORAGE_KEY = 'deleted_history'

function getHistory(): DeletedItem[] {
  return getFromStorage<DeletedItem[]>(STORAGE_KEY, [])
}

function saveHistory(history: DeletedItem[]): void {
  setToStorage(STORAGE_KEY, history)
}

export const historyApi = {
  async getAll(): Promise<DeletedItem[]> {
    await delay()
    return getHistory()
  },

  async getByType(entityType: DeletedEntityType): Promise<DeletedItem[]> {
    await delay()
    const history = getHistory()
    return history.filter((item) => item.entityType === entityType)
  },

  async addToHistory<T>(
    entityType: DeletedEntityType,
    entityId: string,
    entityName: string,
    data: T
  ): Promise<DeletedItem<T>> {
    await delay()
    const history = getHistory()
    const deletedItem: DeletedItem<T> = {
      id: generateId(),
      entityType,
      entityId,
      entityName,
      data,
      deletedAt: new Date().toISOString(),
    }
    history.unshift(deletedItem as DeletedItem)
    saveHistory(history)
    return deletedItem
  },

  async restore(id: string): Promise<void> {
    await delay()
    const history = getHistory()
    const item = history.find((h) => h.id === id)
    if (!item) {
      throw new Error('Deleted item not found')
    }

    // Restore based on entity type
    switch (item.entityType) {
      case 'client': {
        const clientData = item.data as Client
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = clientData
        await clientsApi.create(rest)
        break
      }
      case 'pet': {
        const petData = item.data as Pet
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = petData
        await petsApi.create(rest)
        break
      }
      case 'groomer': {
        const groomerData = item.data as Groomer
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = groomerData
        await groomersApi.create(rest)
        break
      }
      case 'service': {
        const serviceData = item.data as Service
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = serviceData
        await servicesApi.create(rest)
        break
      }
    }

    // Remove from history after successful restore
    const filtered = history.filter((h) => h.id !== id)
    saveHistory(filtered)
  },

  async permanentDelete(id: string): Promise<void> {
    await delay()
    const history = getHistory()
    const filtered = history.filter((h) => h.id !== id)
    saveHistory(filtered)
  },

  async clearAll(): Promise<void> {
    await delay()
    saveHistory([])
  },
}
