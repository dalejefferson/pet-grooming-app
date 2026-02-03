import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petsApi } from '../api'
import { useToast } from '@/modules/ui/hooks/useToast'
import type { Pet, VaccinationRecord } from '../types'

export function usePets(organizationId?: string) {
  return useQuery({
    queryKey: ['pets', organizationId],
    queryFn: () => petsApi.getAll(organizationId),
  })
}

export function usePet(id: string) {
  return useQuery({
    queryKey: ['pet', id],
    queryFn: () => petsApi.getById(id),
    enabled: !!id,
  })
}

export function useClientPets(clientId: string) {
  return useQuery({
    queryKey: ['pets', 'client', clientId],
    queryFn: () => petsApi.getByClientId(clientId),
    enabled: !!clientId,
  })
}

export function useCreatePet() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) =>
      petsApi.create(data),
    onSuccess: (newPet) => {
      showSuccess('Pet added')
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['pets', 'client', newPet.clientId] })
    },
  })
}

export function useUpdatePet() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pet> }) =>
      petsApi.update(id, data),
    onSuccess: (updatedPet) => {
      showSuccess('Pet updated')
      queryClient.setQueryData(['pet', updatedPet.id], updatedPet)
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useDeletePet() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (id: string) => petsApi.delete(id),
    onSuccess: () => {
      showSuccess('Pet removed')
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useAddVaccination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      petId,
      vaccination,
    }: {
      petId: string
      vaccination: Omit<VaccinationRecord, 'id'>
    }) => petsApi.addVaccination(petId, vaccination),
    onSuccess: (updatedPet) => {
      queryClient.setQueryData(['pet', updatedPet.id], updatedPet)
    },
  })
}

export function useRemoveVaccination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ petId, vaccinationId }: { petId: string; vaccinationId: string }) =>
      petsApi.removeVaccination(petId, vaccinationId),
    onSuccess: (updatedPet) => {
      queryClient.setQueryData(['pet', updatedPet.id], updatedPet)
    },
  })
}
