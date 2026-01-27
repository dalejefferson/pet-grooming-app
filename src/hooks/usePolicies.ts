import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { policiesApi } from '@/lib/api'
import type { BookingPolicies } from '@/types'

export function usePolicies(organizationId?: string) {
  return useQuery({
    queryKey: ['policies', organizationId],
    queryFn: () => policiesApi.get(organizationId),
  })
}

export function useUpdatePolicies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<BookingPolicies>) => policiesApi.update(data),
    onSuccess: (updatedPolicies) => {
      queryClient.setQueryData(
        ['policies', updatedPolicies.organizationId],
        updatedPolicies
      )
      queryClient.invalidateQueries({ queryKey: ['policies'] })
    },
  })
}

export function useGeneratePolicyText(policies?: BookingPolicies) {
  return useQuery({
    queryKey: ['policyText', policies],
    queryFn: () => policiesApi.generatePolicyText(policies!),
    enabled: !!policies,
  })
}

export function useCalculateDeposit(totalAmount: number, organizationId: string) {
  return useQuery({
    queryKey: ['deposit', totalAmount, organizationId],
    queryFn: () => policiesApi.calculateDeposit(totalAmount, organizationId),
    enabled: totalAmount > 0 && !!organizationId,
  })
}
