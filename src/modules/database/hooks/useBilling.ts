import { useQuery, useMutation } from '@tanstack/react-query'
import { billingApi } from '../api'
import { useToast } from '@/modules/ui/hooks/useToast'
import type { SubscriptionPlanTier, SubscriptionBillingInterval } from '../types'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription(),
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  })
}

export function useCreateCheckoutSession() {
  const { showError } = useToast()

  return useMutation({
    mutationFn: ({
      planTier,
      billingInterval,
    }: {
      planTier: SubscriptionPlanTier
      billingInterval: SubscriptionBillingInterval
    }) => billingApi.createCheckoutSession(planTier, billingInterval),
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.')
    },
  })
}

export function useCreatePortalSession() {
  const { showError } = useToast()

  return useMutation({
    mutationFn: () => billingApi.createPortalSession(),
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to open billing portal. Please try again.')
    },
  })
}
