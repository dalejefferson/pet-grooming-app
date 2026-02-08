import type { Groomer } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapGroomer, toDbGroomer } from '../types/supabase-mappers'

export const groomersApi = {
  async getAll(organizationId?: string): Promise<Groomer[]> {
    let query = supabase.from('groomers').select('*')

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return (data ?? []).map((row) => mapGroomer(row))
  },

  async getById(id: string): Promise<Groomer | null> {
    const { data, error } = await supabase
      .from('groomers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data ? mapGroomer(data) : null
  },

  async create(data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Groomer> {
    const dbData = toDbGroomer(data)
    const { data: row, error } = await supabase
      .from('groomers')
      .insert(dbData)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapGroomer(row)
  },

  async update(id: string, data: Partial<Groomer>): Promise<Groomer> {
    const dbData = toDbGroomer(data)
    const { data: row, error } = await supabase
      .from('groomers')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapGroomer(row)
  },

  async delete(id: string): Promise<void> {
    // 1. Unassign this groomer from all appointments (set groomer_id to null)
    const { error: unassignError } = await supabase
      .from('appointments')
      .update({ groomer_id: null })
      .eq('groomer_id', id)
    if (unassignError) throw new Error(unassignError.message)

    // 2. Delete staff_availability rows for this staff member
    const { error: availError } = await supabase
      .from('staff_availability')
      .delete()
      .eq('staff_id', id)
    if (availError) throw new Error(availError.message)

    // 3. Delete time_off_requests rows for this staff member
    const { error: timeOffError } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('staff_id', id)
    if (timeOffError) throw new Error(timeOffError.message)

    // 4. Delete the groomer record
    const { error } = await supabase
      .from('groomers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
