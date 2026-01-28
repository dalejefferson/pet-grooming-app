/**
 * In-App Notification Service
 * Manages in-app notifications with localStorage persistence
 */

import { getFromStorage, setToStorage, generateId } from '@/modules/database/storage/localStorage'
import type { InAppNotification } from '@/types'

const STORAGE_KEY = 'in_app_notifications'

/**
 * Creates a new in-app notification
 * @param notification - Notification data (without id and createdAt)
 * @returns The created notification
 */
export async function createNotification(
  notification: Omit<InAppNotification, 'id' | 'createdAt'>
): Promise<InAppNotification> {
  // Simulate minimal delay for consistency
  await new Promise((resolve) => setTimeout(resolve, 50))

  const newNotification: InAppNotification = {
    ...notification,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  // Log to console for debugging
  console.log(`[In-App Notification] Creating notification:`, {
    type: newNotification.type,
    title: newNotification.title,
  })

  // Store in localStorage
  const notifications = getFromStorage<InAppNotification[]>(STORAGE_KEY, [])
  notifications.push(newNotification)
  setToStorage(STORAGE_KEY, notifications)

  return newNotification
}

/**
 * Retrieves all notifications for an organization
 * @param organizationId - Optional organization filter
 * @returns Array of notifications, newest first
 */
export function getNotifications(organizationId?: string): InAppNotification[] {
  const notifications = getFromStorage<InAppNotification[]>(STORAGE_KEY, [])

  const filtered = organizationId
    ? notifications.filter((n) => n.organizationId === organizationId)
    : notifications

  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Gets the count of unread notifications for an organization
 * @param organizationId - Optional organization filter
 * @returns Count of unread notifications
 */
export function getUnreadCount(organizationId?: string): number {
  const notifications = getNotifications(organizationId)
  return notifications.filter((n) => !n.read).length
}

/**
 * Marks a specific notification as read
 * @param id - Notification ID
 * @returns The updated notification, or null if not found
 */
export function markAsRead(id: string): InAppNotification | null {
  const notifications = getFromStorage<InAppNotification[]>(STORAGE_KEY, [])
  const index = notifications.findIndex((n) => n.id === id)

  if (index === -1) {
    return null
  }

  notifications[index] = {
    ...notifications[index],
    read: true,
  }

  setToStorage(STORAGE_KEY, notifications)
  return notifications[index]
}

/**
 * Marks all notifications for an organization as read
 * @param organizationId - Optional organization filter
 * @returns Number of notifications marked as read
 */
export function markAllAsRead(organizationId?: string): number {
  const notifications = getFromStorage<InAppNotification[]>(STORAGE_KEY, [])
  let count = 0

  const updated = notifications.map((n) => {
    if (!n.read && (!organizationId || n.organizationId === organizationId)) {
      count++
      return { ...n, read: true }
    }
    return n
  })

  setToStorage(STORAGE_KEY, updated)
  return count
}

/**
 * Deletes a notification
 * @param id - Notification ID
 * @returns True if deleted, false if not found
 */
export function deleteNotification(id: string): boolean {
  const notifications = getFromStorage<InAppNotification[]>(STORAGE_KEY, [])
  const index = notifications.findIndex((n) => n.id === id)

  if (index === -1) {
    return false
  }

  notifications.splice(index, 1)
  setToStorage(STORAGE_KEY, notifications)
  return true
}

/**
 * Clears all notifications
 * @param organizationId - Optional organization filter (if not provided, clears all)
 */
export function clearNotifications(organizationId?: string): void {
  if (!organizationId) {
    setToStorage(STORAGE_KEY, [])
    return
  }

  const notifications = getFromStorage<InAppNotification[]>(STORAGE_KEY, [])
  const filtered = notifications.filter((n) => n.organizationId !== organizationId)
  setToStorage(STORAGE_KEY, filtered)
}
