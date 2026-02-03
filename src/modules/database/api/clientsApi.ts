import type { Client } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapClient, toDbClient, mapPaymentMethod } from '../types/supabase-mappers'

async function fetchPaymentMethods(clientId: string) {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('client_id', clientId)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapPaymentMethod)
}

async function fetchPaymentMethodsForClients(clientIds: string[]) {
  if (clientIds.length === 0) return new Map<string, ReturnType<typeof mapPaymentMethod>[]>()

  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .in('client_id', clientIds)

  if (error) throw new Error(error.message)

  const map = new Map<string, ReturnType<typeof mapPaymentMethod>[]>()
  for (const row of data ?? []) {
    const pm = mapPaymentMethod(row)
    const existing = map.get(row.client_id) ?? []
    existing.push(pm)
    map.set(row.client_id, existing)
  }
  return map
}

export const clientsApi = {
  async getAll(organizationId?: string): Promise<Client[]> {
    let query = supabase
      .from('clients')
      .select('*')
      .order('last_name')

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const clientIds = rows.map((r) => r.id)
    const pmMap = await fetchPaymentMethodsForClients(clientIds)

    return rows.map((row) => mapClient(row, pmMap.get(row.id) ?? []))
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    if (!data) return null

    const paymentMethods = await fetchPaymentMethods(data.id)
    return mapClient(data, paymentMethods)
  },

  async getByEmail(email: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    if (!data) return null

    const paymentMethods = await fetchPaymentMethods(data.id)
    return mapClient(data, paymentMethods)
  },

  async search(query: string, organizationId?: string): Promise<Client[]> {
    const pattern = `%${query}%`
    let dbQuery = supabase
      .from('clients')
      .select('*')
      .or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
      )

    if (organizationId) {
      dbQuery = dbQuery.eq('organization_id', organizationId)
    }

    const { data, error } = await dbQuery
    if (error) throw new Error(error.message)

    const rows = data ?? []
    const clientIds = rows.map((r) => r.id)
    const pmMap = await fetchPaymentMethodsForClients(clientIds)

    return rows.map((row) => mapClient(row, pmMap.get(row.id) ?? []))
  },

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const dbData = toDbClient(data)
    const { data: row, error } = await supabase
      .from('clients')
      .insert(dbData)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapClient(row, [])
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const dbData = toDbClient(data)
    const { data: row, error } = await supabase
      .from('clients')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    const paymentMethods = await fetchPaymentMethods(row.id)
    return mapClient(row, paymentMethods)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}
