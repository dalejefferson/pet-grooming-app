import type { Service, ServiceModifier } from '@/types'
import { getFromStorage, setToStorage, delay, generateId } from './storage'
import { seedServices } from './seed'

const STORAGE_KEY = 'services'

function getServices(): Service[] {
  return getFromStorage<Service[]>(STORAGE_KEY, seedServices)
}

function saveServices(services: Service[]): void {
  setToStorage(STORAGE_KEY, services)
}

export const servicesApi = {
  async getAll(organizationId?: string): Promise<Service[]> {
    await delay()
    const services = getServices()
    if (organizationId) {
      return services.filter((s) => s.organizationId === organizationId)
    }
    return services
  },

  async getActive(organizationId?: string): Promise<Service[]> {
    await delay()
    const services = getServices()
    return services.filter((s) => {
      if (organizationId && s.organizationId !== organizationId) return false
      return s.isActive
    })
  },

  async getById(id: string): Promise<Service | null> {
    await delay()
    const services = getServices()
    return services.find((s) => s.id === id) ?? null
  },

  async getByCategory(
    category: Service['category'],
    organizationId?: string
  ): Promise<Service[]> {
    await delay()
    const services = getServices()
    return services.filter((s) => {
      if (organizationId && s.organizationId !== organizationId) return false
      return s.category === category && s.isActive
    })
  },

  async create(
    data: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>
  ): Promise<Service> {
    await delay()
    const services = getServices()
    const now = new Date().toISOString()
    const newService: Service = {
      ...data,
      id: generateId(),
      modifiers: [],
      createdAt: now,
      updatedAt: now,
    }
    services.push(newService)
    saveServices(services)
    return newService
  },

  async update(id: string, data: Partial<Service>): Promise<Service> {
    await delay()
    const services = getServices()
    const index = services.findIndex((s) => s.id === id)
    if (index === -1) {
      throw new Error('Service not found')
    }
    services[index] = {
      ...services[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveServices(services)
    return services[index]
  },

  async delete(id: string): Promise<void> {
    await delay()
    const services = getServices()
    const filtered = services.filter((s) => s.id !== id)
    saveServices(filtered)
  },

  async addModifier(
    serviceId: string,
    modifier: Omit<ServiceModifier, 'id' | 'serviceId'>
  ): Promise<Service> {
    await delay()
    const services = getServices()
    const index = services.findIndex((s) => s.id === serviceId)
    if (index === -1) {
      throw new Error('Service not found')
    }
    const newModifier: ServiceModifier = {
      ...modifier,
      id: generateId(),
      serviceId,
    }
    services[index].modifiers.push(newModifier)
    services[index].updatedAt = new Date().toISOString()
    saveServices(services)
    return services[index]
  },

  async updateModifier(
    serviceId: string,
    modifierId: string,
    data: Partial<ServiceModifier>
  ): Promise<Service> {
    await delay()
    const services = getServices()
    const serviceIndex = services.findIndex((s) => s.id === serviceId)
    if (serviceIndex === -1) {
      throw new Error('Service not found')
    }
    const modIndex = services[serviceIndex].modifiers.findIndex(
      (m) => m.id === modifierId
    )
    if (modIndex === -1) {
      throw new Error('Modifier not found')
    }
    services[serviceIndex].modifiers[modIndex] = {
      ...services[serviceIndex].modifiers[modIndex],
      ...data,
    }
    services[serviceIndex].updatedAt = new Date().toISOString()
    saveServices(services)
    return services[serviceIndex]
  },

  async removeModifier(serviceId: string, modifierId: string): Promise<Service> {
    await delay()
    const services = getServices()
    const index = services.findIndex((s) => s.id === serviceId)
    if (index === -1) {
      throw new Error('Service not found')
    }
    services[index].modifiers = services[index].modifiers.filter(
      (m) => m.id !== modifierId
    )
    services[index].updatedAt = new Date().toISOString()
    saveServices(services)
    return services[index]
  },
}
