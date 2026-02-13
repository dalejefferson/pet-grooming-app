import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffApi } from '../api/staffApi'
import { useOrganization } from './useOrganization'
import { useToast } from '@/modules/ui/hooks/useToast'
import type { Groomer } from '../types'

export function useGroomers() {
  const { data: organization } = useOrganization()
  const organizationId = organization?.id

  return useQuery({
    queryKey: ['groomers', organizationId],
    queryFn: () => staffApi.getAll(organizationId),
    enabled: !!organizationId,
  })
}

export function useGroomer(id: string) {
  return useQuery({
    queryKey: ['groomer', id],
    queryFn: () => staffApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateGroomer() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) =>
      staffApi.create(data),
    onSuccess: () => {
      showSuccess('Staff member added')
      queryClient.invalidateQueries({ queryKey: ['groomers'] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}

export function useUpdateGroomer() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Groomer> }) =>
      staffApi.update(id, data),
    onSuccess: (updatedGroomer) => {
      showSuccess('Staff updated')
      queryClient.setQueryData(['groomer', updatedGroomer.id], updatedGroomer)
      queryClient.invalidateQueries({ queryKey: ['groomers'] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}

export function useDeleteGroomer() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      showSuccess('Staff member removed')
      queryClient.invalidateQueries({ queryKey: ['groomers'] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}
