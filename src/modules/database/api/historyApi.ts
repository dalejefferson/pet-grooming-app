import type { DeletedItem, DeletedEntityType } from '../types'
import { supabase } from '@/lib/supabase/client'
import {
  mapDeletedItem,
  toDbClient,
  toDbPet,
  toDbGroomer,
  toDbService,
  toDbVaccinationRecord,
  toDbServiceModifier,
} from '../types/supabase-mappers'
import type { Client, Pet, Groomer, Service } from '../types'

export const historyApi = {
  async getAll(): Promise<DeletedItem[]> {
    const { data, error } = await supabase
      .from('deleted_items')
      .select('*')
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapDeletedItem)
  },

  async getByType(entityType: DeletedEntityType): Promise<DeletedItem[]> {
    const { data, error } = await supabase
      .from('deleted_items')
      .select('*')
      .eq('entity_type', entityType)
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapDeletedItem)
  },

  async addToHistory<T>(
    entityType: DeletedEntityType,
    entityId: string,
    entityName: string,
    data: T
  ): Promise<DeletedItem<T>> {
    const { data: row, error } = await supabase
      .from('deleted_items')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        data,
        deleted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return mapDeletedItem(row) as DeletedItem<T>
  },

  async restore(id: string): Promise<void> {
    // Fetch the deleted item
    const { data: row, error: fetchError } = await supabase
      .from('deleted_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!row) throw new Error('Deleted item not found')

    const item = mapDeletedItem(row)

    // Restore the entity by inserting directly into the original table
    // The data field contains the full entity snapshot including original id
    switch (item.entityType) {
      case 'client': {
        const clientData = item.data as Client
        const dbRow = toDbClient(clientData)
        dbRow.id = clientData.id
        dbRow.created_at = clientData.createdAt
        dbRow.updated_at = clientData.updatedAt

        const { error } = await supabase
          .from('clients')
          .insert(dbRow)

        if (error) throw error
        break
      }
      case 'pet': {
        const petData = item.data as Pet
        const dbRow = toDbPet(petData)
        dbRow.id = petData.id
        dbRow.created_at = petData.createdAt
        dbRow.updated_at = petData.updatedAt

        const { error } = await supabase
          .from('pets')
          .insert(dbRow)

        if (error) throw error

        // Also restore vaccination records if present
        if (petData.vaccinations && petData.vaccinations.length > 0) {
          const vaxRows = petData.vaccinations.map((vax) => {
            const vaxRow = toDbVaccinationRecord({ ...vax, petId: petData.id })
            vaxRow.id = vax.id
            return vaxRow
          })

          const { error: vaxError } = await supabase
            .from('vaccination_records')
            .insert(vaxRows)

          if (vaxError) throw vaxError
        }
        break
      }
      case 'groomer': {
        const groomerData = item.data as Groomer
        const dbRow = toDbGroomer(groomerData)
        dbRow.id = groomerData.id
        dbRow.created_at = groomerData.createdAt
        dbRow.updated_at = groomerData.updatedAt

        const { error } = await supabase
          .from('groomers')
          .insert(dbRow)

        if (error) throw error
        break
      }
      case 'service': {
        const serviceData = item.data as Service
        const dbRow = toDbService(serviceData)
        dbRow.id = serviceData.id
        dbRow.created_at = serviceData.createdAt
        dbRow.updated_at = serviceData.updatedAt

        const { error } = await supabase
          .from('services')
          .insert(dbRow)

        if (error) throw error

        // Also restore service modifiers if present
        if (serviceData.modifiers && serviceData.modifiers.length > 0) {
          const modRows = serviceData.modifiers.map((mod) => {
            const modRow = toDbServiceModifier(mod)
            modRow.id = mod.id
            modRow.service_id = serviceData.id
            return modRow
          })

          const { error: modError } = await supabase
            .from('service_modifiers')
            .insert(modRows)

          if (modError) throw modError
        }
        break
      }
    }

    // Remove from deleted_items after successful restore
    const { error: deleteError } = await supabase
      .from('deleted_items')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
  },

  async permanentDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('deleted_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async clearAll(): Promise<void> {
    const { error } = await supabase
      .from('deleted_items')
      .delete()
      .neq('id', '')

    if (error) throw error
  },
}
