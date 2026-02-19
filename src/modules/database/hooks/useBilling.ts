import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '../api'
import { useToast } from '@/modules/ui/hooks/useToast'
import type { SubscriptionPlanTier, SubscriptionBillingInterval } from '../types'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription(),
    refetchOnWindowFocus: true,
    staleTime: Infinity,
  })
}

export function useInvoices(startingAfter?: string) {
  return useQuery({
    queryKey: ['invoices', startingAfter],
    queryFn: () => billingApi.listInvoices(startingAfter),
    staleTime: 60_000,
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

export function useCancelSubscription() {
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      showSuccess('Subscription canceled', 'Your subscription will remain active until the end of your current billing period.')
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.')
    },
  })
}
