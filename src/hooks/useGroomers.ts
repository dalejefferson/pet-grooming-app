import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groomersApi } from '@/lib/api'
import { useOrganization } from './useOrganization'
import type { Groomer } from '@/types'

export function useGroomers() {
  const { data: organization } = useOrganization()
  const organizationId = organization?.id

  return useQuery({
    queryKey: ['groomers', organizationId],
    queryFn: () => groomersApi.getAll(organizationId),
    enabled: !!organizationId,
  })
}

export function useGroomer(id: string) {
  return useQuery({
    queryKey: ['groomer', id],
    queryFn: () => groomersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateGroomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) =>
      groomersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groomers'] })
    },
  })
}

export function useUpdateGroomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Groomer> }) =>
      groomersApi.update(id, data),
    onSuccess: (updatedGroomer) => {
      queryClient.setQueryData(['groomer', updatedGroomer.id], updatedGroomer)
      queryClient.invalidateQueries({ queryKey: ['groomers'] })
    },
  })
}

export function useDeleteGroomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => groomersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groomers'] })
    },
  })
}
