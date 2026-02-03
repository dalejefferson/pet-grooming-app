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
    const { error } = await supabase
      .from('groomers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
