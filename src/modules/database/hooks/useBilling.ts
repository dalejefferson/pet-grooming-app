import { useQuery, useMutation } from '@tanstack/react-query'
import { billingApi } from '../api'
import type { SubscriptionPlanTier, SubscriptionBillingInterval } from '../types'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription(),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })
}

export function useCreateCheckoutSession() {
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
  })
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () => billingApi.createPortalSession(),
    onSuccess: (url) => {
      window.location.href = url
    },
  })
}
