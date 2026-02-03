/**
 * In-App Notification Service
 * Manages in-app notifications with Supabase persistence
 */

import { supabase } from '@/lib/supabase/client'
import type { InAppNotification } from '@/types'

function mapNotification(row: Record<string, unknown>): InAppNotification {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    type: row.type as InAppNotification['type'],
    title: row.title as string,
    message: row.message as string,
    read: row.read as boolean,
    actionUrl: (row.action_url as string) ?? undefined,
    createdAt: row.created_at as string,
  }
}

/**
 * Creates a new in-app notification
 */
export async function createNotification(
  notification: Omit<InAppNotification, 'id' | 'createdAt'>
): Promise<InAppNotification> {
  console.log(`[In-App Notification] Creating notification:`, {
    type: notification.type,
    title: notification.title,
  })

  const { data, error } = await supabase
    .from('in_app_notifications')
    .insert({
      organization_id: notification.organizationId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read ?? false,
      action_url: notification.actionUrl,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapNotification(data)
}

/**
 * Retrieves all notifications for an organization
 */
export async function getNotifications(organizationId?: string): Promise<InAppNotification[]> {
  let query = supabase
    .from('in_app_notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapNotification)
}

/**
 * Gets the count of unread notifications for an organization
 */
export async function getUnreadCount(organizationId?: string): Promise<number> {
  let query = supabase
    .from('in_app_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Marks a specific notification as read
 */
export async function markAsRead(id: string): Promise<InAppNotification | null> {
  const { data, error } = await supabase
    .from('in_app_notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data ? mapNotification(data) : null
}

/**
 * Marks all notifications for an organization as read
 */
export async function markAllAsRead(organizationId?: string): Promise<number> {
  let query = supabase
    .from('in_app_notifications')
    .update({ read: true })
    .eq('read', false)

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query.select()
  if (error) throw new Error(error.message)
  return data?.length ?? 0
}

/**
 * Deletes a notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('in_app_notifications')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

/**
 * Clears all notifications
 */
export async function clearNotifications(organizationId?: string): Promise<void> {
  let query = supabase.from('in_app_notifications').delete()

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  } else {
    query = query.neq('id', '')
  }

  const { error } = await query
  if (error) throw new Error(error.message)
}
