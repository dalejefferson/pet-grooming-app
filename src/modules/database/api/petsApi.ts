import type { Pet, VaccinationRecord } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { seedPets } from '../seed/seed'

const STORAGE_KEY = 'pets'

function getPets(): Pet[] {
  return getFromStorage<Pet[]>(STORAGE_KEY, seedPets)
}

function savePets(pets: Pet[]): void {
  setToStorage(STORAGE_KEY, pets)
}

export const petsApi = {
  async getAll(organizationId?: string): Promise<Pet[]> {
    await delay()
    const pets = getPets()
    if (organizationId) {
      return pets.filter((p) => p.organizationId === organizationId)
    }
    return pets
  },

  async getById(id: string): Promise<Pet | null> {
    await delay()
    const pets = getPets()
    return pets.find((p) => p.id === id) ?? null
  },

  async getByClientId(clientId: string): Promise<Pet[]> {
    await delay()
    const pets = getPets()
    return pets.filter((p) => p.clientId === clientId)
  },

  async create(data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
    await delay()
    const pets = getPets()
    const now = new Date().toISOString()
    const newPet: Pet = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    pets.push(newPet)
    savePets(pets)
    return newPet
  },

  async update(id: string, data: Partial<Pet>): Promise<Pet> {
    await delay()
    const pets = getPets()
    const index = pets.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error('Pet not found')
    }
    pets[index] = {
      ...pets[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    savePets(pets)
    return pets[index]
  },

  async delete(id: string): Promise<void> {
    await delay()
    const pets = getPets()
    const filtered = pets.filter((p) => p.id !== id)
    savePets(filtered)
  },

  async addVaccination(
    petId: string,
    vaccination: Omit<VaccinationRecord, 'id'>
  ): Promise<Pet> {
    await delay()
    const pets = getPets()
    const index = pets.findIndex((p) => p.id === petId)
    if (index === -1) {
      throw new Error('Pet not found')
    }
    const newVax: VaccinationRecord = {
      ...vaccination,
      id: generateId(),
    }
    pets[index].vaccinations.push(newVax)
    pets[index].updatedAt = new Date().toISOString()
    savePets(pets)
    return pets[index]
  },

  async removeVaccination(petId: string, vaccinationId: string): Promise<Pet> {
    await delay()
    const pets = getPets()
    const index = pets.findIndex((p) => p.id === petId)
    if (index === -1) {
      throw new Error('Pet not found')
    }
    pets[index].vaccinations = pets[index].vaccinations.filter(
      (v) => v.id !== vaccinationId
    )
    pets[index].updatedAt = new Date().toISOString()
    savePets(pets)
    return pets[index]
  },
}
