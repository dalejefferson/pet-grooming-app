import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petsApi } from '@/lib/api'
import type { Pet, VaccinationRecord } from '@/types'

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

  return useMutation({
    mutationFn: (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) =>
      petsApi.create(data),
    onSuccess: (newPet) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['pets', 'client', newPet.clientId] })
    },
  })
}

export function useUpdatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pet> }) =>
      petsApi.update(id, data),
    onSuccess: (updatedPet) => {
      queryClient.setQueryData(['pet', updatedPet.id], updatedPet)
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useDeletePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => petsApi.delete(id),
    onSuccess: () => {
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
