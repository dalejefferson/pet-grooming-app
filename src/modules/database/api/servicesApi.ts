import type { Service, ServiceModifier } from '../types'
import { supabase } from '@/lib/supabase/client'
import {
  mapService,
  toDbService,
  mapServiceModifier,
  toDbServiceModifier,
} from '../types/supabase-mappers'

async function fetchModifiers(serviceId: string): Promise<ServiceModifier[]> {
  const { data, error } = await supabase
    .from('service_modifiers')
    .select('*')
    .eq('service_id', serviceId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapServiceModifier)
}

async function fetchModifiersForServices(serviceIds: string[]) {
  if (serviceIds.length === 0) return new Map<string, ServiceModifier[]>()

  const { data, error } = await supabase
    .from('service_modifiers')
    .select('*')
    .in('service_id', serviceIds)

  if (error) throw new Error(error.message)

  const map = new Map<string, ServiceModifier[]>()
  for (const row of data ?? []) {
    const mod = mapServiceModifier(row)
    const existing = map.get(row.service_id) ?? []
    existing.push(mod)
    map.set(row.service_id, existing)
  }
  return map
}

async function fetchServiceWithModifiers(serviceId: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  if (!data) return null

  const modifiers = await fetchModifiers(serviceId)
  return mapService(data, modifiers)
}

export const servicesApi = {
  async getAll(organizationId?: string): Promise<Service[]> {
    let query = supabase.from('services').select('*')

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const serviceIds = rows.map((r) => r.id)
    const modMap = await fetchModifiersForServices(serviceIds)

    return rows.map((row) => mapService(row, modMap.get(row.id) ?? []))
  },

  async getActive(organizationId?: string): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const serviceIds = rows.map((r) => r.id)
    const modMap = await fetchModifiersForServices(serviceIds)

    return rows.map((row) => mapService(row, modMap.get(row.id) ?? []))
  },

  async getById(id: string): Promise<Service | null> {
    return fetchServiceWithModifiers(id)
  },

  async getByCategory(
    category: Service['category'],
    organizationId?: string
  ): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const serviceIds = rows.map((r) => r.id)
    const modMap = await fetchModifiersForServices(serviceIds)

    return rows.map((row) => mapService(row, modMap.get(row.id) ?? []))
  },

  async create(
    data: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>
  ): Promise<Service> {
    const dbData = toDbService(data)
    const { data: row, error } = await supabase
      .from('services')
      .insert(dbData)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapService(row, [])
  },

  async update(id: string, data: Partial<Service>): Promise<Service> {
    const dbData = toDbService(data)
    const { data: row, error } = await supabase
      .from('services')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const modifiers = await fetchModifiers(row.id)
    return mapService(row, modifiers)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async addModifier(
    serviceId: string,
    modifier: Omit<ServiceModifier, 'id' | 'serviceId'>
  ): Promise<Service> {
    const dbMod = toDbServiceModifier({ ...modifier, serviceId })
    const { error } = await supabase
      .from('service_modifiers')
      .insert(dbMod)

    if (error) throw new Error(error.message)

    const service = await fetchServiceWithModifiers(serviceId)
    if (!service) throw new Error('Service not found')
    return service
  },

  async updateModifier(
    serviceId: string,
    modifierId: string,
    data: Partial<ServiceModifier>
  ): Promise<Service> {
    const dbMod = toDbServiceModifier(data)
    const { error } = await supabase
      .from('service_modifiers')
      .update(dbMod)
      .eq('id', modifierId)

    if (error) throw new Error(error.message)

    const service = await fetchServiceWithModifiers(serviceId)
    if (!service) throw new Error('Service not found')
    return service
  },

  async removeModifier(serviceId: string, modifierId: string): Promise<Service> {
    // Check if modifier is referenced by existing appointments
    const { data: refs, error: refError } = await supabase
      .from('appointment_services')
      .select('id')
      .contains('applied_modifier_ids', [modifierId])

    if (refError) throw new Error(refError.message)
    if (refs && refs.length > 0) {
      throw new Error('Cannot delete modifier — it is referenced by existing appointments.')
    }

    const { error } = await supabase
      .from('service_modifiers')
      .delete()
      .eq('id', modifierId)

    if (error) throw new Error(error.message)

    const service = await fetchServiceWithModifiers(serviceId)
    if (!service) throw new Error('Service not found')
    return service
  },
}
