/**
 * React Query hooks for in-app notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
} from '../services/inAppNotificationService'
import type { InAppNotification } from '@/types'

// ============================================
// Query Keys
// ============================================

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (orgId?: string) => [...notificationKeys.all, 'list', orgId] as const,
  unreadCount: (orgId?: string) => [...notificationKeys.all, 'unread', orgId] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to get all notifications for an organization
 * @param organizationId - Optional organization filter (defaults to 'org-1')
 */
export function useNotifications(organizationId: string = 'org-1') {
  return useQuery({
    queryKey: notificationKeys.list(organizationId),
    queryFn: () => getNotifications(organizationId),
    // Refresh every 30 seconds
    refetchInterval: 30 * 1000,
  })
}

/**
 * Hook to get unread notification count
 * @param organizationId - Optional organization filter (defaults to 'org-1')
 */
export function useUnreadNotificationCount(organizationId: string = 'org-1') {
  return useQuery({
    queryKey: notificationKeys.unreadCount(organizationId),
    queryFn: () => getUnreadCount(organizationId),
    // Refresh every 15 seconds
    refetchInterval: 15 * 1000,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to create a new notification
 */
export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<InAppNotification, 'id' | 'createdAt'>) => createNotification(data),
    onSuccess: (newNotification) => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(newNotification.organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(newNotification.organizationId),
      })
    },
  })
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<InAppNotification> => {
      const result = markAsRead(id)
      if (!result) {
        throw new Error('Notification not found')
      }
      return result
    },
    onSuccess: (updatedNotification) => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(updatedNotification.organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(updatedNotification.organizationId),
      })
    },
  })
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (organizationId: string = 'org-1'): Promise<{ count: number; organizationId: string }> => {
      const count = markAllAsRead(organizationId)
      return { count, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(organizationId),
      })
    },
  })
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }): Promise<{ id: string; organizationId: string }> => {
      const success = deleteNotification(id)
      if (!success) {
        throw new Error('Notification not found')
      }
      return { id, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list(organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(organizationId),
      })
    },
  })
}
