import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../api'
import type { Client } from '../types'

export function useClients(organizationId?: string) {
  return useQuery({
    queryKey: ['clients', organizationId],
    queryFn: () => clientsApi.getAll(organizationId),
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  })
}

export function useSearchClients(query: string, organizationId?: string) {
  return useQuery({
    queryKey: ['clients', 'search', query, organizationId],
    queryFn: () => clientsApi.search(query, organizationId),
    enabled: query.length >= 2,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) =>
      clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      clientsApi.update(id, data),
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(['client', updatedClient.id], updatedClient)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
