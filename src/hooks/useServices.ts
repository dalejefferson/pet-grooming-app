import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/lib/api'
import type { Service, ServiceModifier } from '@/types'

export function useServices(organizationId?: string) {
  return useQuery({
    queryKey: ['services', organizationId],
    queryFn: () => servicesApi.getAll(organizationId),
  })
}

export function useActiveServices(organizationId?: string) {
  return useQuery({
    queryKey: ['services', 'active', organizationId],
    queryFn: () => servicesApi.getActive(organizationId),
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesApi.getById(id),
    enabled: !!id,
  })
}

export function useServicesByCategory(
  category: Service['category'],
  organizationId?: string
) {
  return useQuery({
    queryKey: ['services', 'category', category, organizationId],
    queryFn: () => servicesApi.getByCategory(category, organizationId),
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>
    ) => servicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesApi.update(id, data),
    onSuccess: (updatedService) => {
      queryClient.setQueryData(['service', updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useAddModifier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      serviceId,
      modifier,
    }: {
      serviceId: string
      modifier: Omit<ServiceModifier, 'id' | 'serviceId'>
    }) => servicesApi.addModifier(serviceId, modifier),
    onSuccess: (updatedService) => {
      queryClient.setQueryData(['service', updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateModifier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      serviceId,
      modifierId,
      data,
    }: {
      serviceId: string
      modifierId: string
      data: Partial<ServiceModifier>
    }) => servicesApi.updateModifier(serviceId, modifierId, data),
    onSuccess: (updatedService) => {
      queryClient.setQueryData(['service', updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useRemoveModifier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId, modifierId }: { serviceId: string; modifierId: string }) =>
      servicesApi.removeModifier(serviceId, modifierId),
    onSuccess: (updatedService) => {
      queryClient.setQueryData(['service', updatedService.id], updatedService)
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
