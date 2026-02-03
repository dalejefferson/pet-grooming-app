import type { Pet, VaccinationRecord } from '../types'
import { supabase } from '@/lib/supabase/client'
import {
  mapPet,
  toDbPet,
  mapVaccinationRecord,
  toDbVaccinationRecord,
} from '../types/supabase-mappers'

async function fetchVaccinations(petId: string): Promise<VaccinationRecord[]> {
  const { data, error } = await supabase
    .from('vaccination_records')
    .select('*')
    .eq('pet_id', petId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapVaccinationRecord)
}

async function fetchVaccinationsForPets(petIds: string[]) {
  if (petIds.length === 0) return new Map<string, VaccinationRecord[]>()

  const { data, error } = await supabase
    .from('vaccination_records')
    .select('*')
    .in('pet_id', petIds)

  if (error) throw new Error(error.message)

  const map = new Map<string, VaccinationRecord[]>()
  for (const row of data ?? []) {
    const vax = mapVaccinationRecord(row)
    const existing = map.get(row.pet_id) ?? []
    existing.push(vax)
    map.set(row.pet_id, existing)
  }
  return map
}

async function fetchPetWithVaccinations(petId: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  if (!data) return null

  const vaccinations = await fetchVaccinations(petId)
  return mapPet(data, vaccinations)
}

export const petsApi = {
  async getAll(organizationId?: string): Promise<Pet[]> {
    let query = supabase.from('pets').select('*')

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const petIds = rows.map((r) => r.id)
    const vaxMap = await fetchVaccinationsForPets(petIds)

    return rows.map((row) => mapPet(row, vaxMap.get(row.id) ?? []))
  },

  async getById(id: string): Promise<Pet | null> {
    return fetchPetWithVaccinations(id)
  },

  async getByClientId(clientId: string): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('client_id', clientId)

    if (error) throw new Error(error.message)

    const rows = data ?? []
    const petIds = rows.map((r) => r.id)
    const vaxMap = await fetchVaccinationsForPets(petIds)

    return rows.map((row) => mapPet(row, vaxMap.get(row.id) ?? []))
  },

  async create(data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
    const dbData = toDbPet(data)
    const { data: row, error } = await supabase
      .from('pets')
      .insert(dbData)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapPet(row, [])
  },

  async update(id: string, data: Partial<Pet>): Promise<Pet> {
    const dbData = toDbPet(data)
    const { data: row, error } = await supabase
      .from('pets')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const vaccinations = await fetchVaccinations(row.id)
    return mapPet(row, vaccinations)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async addVaccination(
    petId: string,
    vaccination: Omit<VaccinationRecord, 'id'>
  ): Promise<Pet> {
    const dbVax = toDbVaccinationRecord({ ...vaccination, petId })
    const { error } = await supabase
      .from('vaccination_records')
      .insert(dbVax)

    if (error) throw new Error(error.message)

    const pet = await fetchPetWithVaccinations(petId)
    if (!pet) throw new Error('Pet not found')
    return pet
  },

  async removeVaccination(petId: string, vaccinationId: string): Promise<Pet> {
    const { error } = await supabase
      .from('vaccination_records')
      .delete()
      .eq('id', vaccinationId)

    if (error) throw new Error(error.message)

    const pet = await fetchPetWithVaccinations(petId)
    if (!pet) throw new Error('Pet not found')
    return pet
  },
}
