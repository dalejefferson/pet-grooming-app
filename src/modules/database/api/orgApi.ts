import type { Organization } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapOrganization, toDbOrganization } from '../types/supabase-mappers'

export const orgApi = {
  async getBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      // PGRST116 = no rows returned
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data ? mapOrganization(data) : null
  },

  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data ? mapOrganization(data) : null
  },

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const dbData = toDbOrganization(data)
    const { data: row, error } = await supabase
      .from('organizations')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapOrganization(row)
  },

  async getCurrent(): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single()

    if (error) throw new Error(error.message)
    return mapOrganization(data)
  },
}
