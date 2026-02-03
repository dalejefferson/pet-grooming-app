import { supabase } from '@/lib/supabase/client'
import type { User } from '../types'
import type { RolePermissions, StaffRole } from '@/modules/database/types'

function mapUserRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as StaffRole,
    organizationId: row.organization_id as string,
    avatar: (row.avatar as string) ?? undefined,
    createdAt: row.created_at as string,
    permissionOverrides: row.permission_overrides as Partial<RolePermissions> | undefined,
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('No user returned')

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw new Error(profileError.message)

    return mapUserRow(profile)
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      // Profile may not exist yet for new OAuth users (trigger race condition).
      // Wait briefly and retry once.
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data: retryProfile, error: retryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (retryError || !retryProfile) return null

      return mapUserRow(retryProfile)
    }

    return mapUserRow(profile)
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []).map(mapUserRow)
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return mapUserRow(data)
  },

  async getGroomers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['owner', 'admin', 'groomer'])
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []).map(mapUserRow)
  },

  async updateUserPermissions(
    userId: string,
    updates: { role?: StaffRole; permissionOverrides?: Partial<RolePermissions> }
  ): Promise<User> {
    const updateData: Record<string, unknown> = {}
    if (updates.role !== undefined) updateData.role = updates.role
    if (updates.permissionOverrides !== undefined) {
      updateData.permission_overrides = updates.permissionOverrides
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return mapUserRow(data)
  },
}
