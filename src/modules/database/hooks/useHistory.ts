import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { historyApi } from '../api/historyApi'
import type { DeletedEntityType, DeletedItem } from '../types'

export function useDeletedHistory(entityType?: DeletedEntityType) {
  return useQuery({
    queryKey: ['deleted-history', entityType],
    queryFn: () => (entityType ? historyApi.getByType(entityType) : historyApi.getAll()),
  })
}

interface AddToHistoryParams {
  entityType: DeletedEntityType
  entityId: string
  entityName: string
  data: unknown
}

export function useAddToHistory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entityType, entityId, entityName, data }: AddToHistoryParams) =>
      historyApi.addToHistory(entityType, entityId, entityName, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deleted-history'] })
      queryClient.invalidateQueries({ queryKey: ['deleted-history', variables.entityType] })
    },
  })
}

export function useRestoreFromHistory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, entityType }: { id: string; entityType: DeletedEntityType }) =>
      historyApi.restore(id).then(() => entityType),
    onSuccess: (entityType) => {
      // Invalidate history queries
      queryClient.invalidateQueries({ queryKey: ['deleted-history'] })
      // Invalidate the entity list that was restored to
      switch (entityType) {
        case 'client':
          queryClient.invalidateQueries({ queryKey: ['clients'] })
          break
        case 'pet':
          queryClient.invalidateQueries({ queryKey: ['pets'] })
          break
        case 'groomer':
          queryClient.invalidateQueries({ queryKey: ['groomers'] })
          break
        case 'service':
          queryClient.invalidateQueries({ queryKey: ['services'] })
          break
      }
    },
  })
}

export function usePermanentDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => historyApi.permanentDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-history'] })
    },
  })
}

export function useClearHistory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => historyApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-history'] })
    },
  })
}

// Helper function to get display info for deleted items
export function getDeletedItemInfo(item: DeletedItem): {
  icon: string
  typeLabel: string
  timeAgo: string
} {
  const typeLabels: Record<DeletedEntityType, string> = {
    client: 'Client',
    pet: 'Pet',
    groomer: 'Groomer',
    service: 'Service',
  }

  const deletedDate = new Date(item.deletedAt)
  const now = new Date()
  const diffMs = now.getTime() - deletedDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let timeAgo: string
  if (diffMins < 1) {
    timeAgo = 'Just now'
  } else if (diffMins < 60) {
    timeAgo = `${diffMins}m ago`
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h ago`
  } else {
    timeAgo = `${diffDays}d ago`
  }

  return {
    icon: item.entityType,
    typeLabel: typeLabels[item.entityType],
    timeAgo,
  }
}
