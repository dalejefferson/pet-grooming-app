import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentMethodsApi } from '../api/paymentMethodsApi'
import type { PaymentMethod } from '../types'
import type { CardDetails } from '../api/paymentMethodsApi'

/**
 * Query key factory for payment methods
 */
const paymentMethodsKeys = {
  all: ['paymentMethods'] as const,
  byClient: (clientId: string) => ['paymentMethods', 'client', clientId] as const,
  default: (clientId: string) => ['paymentMethods', 'default', clientId] as const,
}

/**
 * Hook to fetch all payment methods for a client
 */
export function useClientPaymentMethods(clientId: string) {
  return useQuery({
    queryKey: paymentMethodsKeys.byClient(clientId),
    queryFn: () => paymentMethodsApi.getByClientId(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to fetch the default payment method for a client
 */
export function useDefaultPaymentMethod(clientId: string) {
  return useQuery({
    queryKey: paymentMethodsKeys.default(clientId),
    queryFn: () => paymentMethodsApi.getDefault(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to add a new payment method for a client
 */
export function useAddPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, cardDetails }: { clientId: string; cardDetails: CardDetails }) =>
      paymentMethodsApi.create(clientId, cardDetails),
    onSuccess: (newMethod) => {
      // Invalidate the client's payment methods
      queryClient.invalidateQueries({
        queryKey: paymentMethodsKeys.byClient(newMethod.clientId),
      })
      // Also invalidate the default payment method query
      queryClient.invalidateQueries({
        queryKey: paymentMethodsKeys.default(newMethod.clientId),
      })
      // Invalidate the client query as payment methods are stored on the client
      queryClient.invalidateQueries({
        queryKey: ['client', newMethod.clientId],
      })
    },
  })
}

/**
 * Hook to delete a payment method
 */
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentMethodId }: { paymentMethodId: string; clientId: string }) =>
      paymentMethodsApi.delete(paymentMethodId),
    onSuccess: (_, { clientId }) => {
      // Invalidate the client's payment methods
      queryClient.invalidateQueries({
        queryKey: paymentMethodsKeys.byClient(clientId),
      })
      // Also invalidate the default payment method query
      queryClient.invalidateQueries({
        queryKey: paymentMethodsKeys.default(clientId),
      })
      // Invalidate the client query as payment methods are stored on the client
      queryClient.invalidateQueries({
        queryKey: ['client', clientId],
      })
    },
  })
}

/**
 * Hook to set a payment method as the default
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, paymentMethodId }: { clientId: string; paymentMethodId: string }) =>
      paymentMethodsApi.setDefault(clientId, paymentMethodId),
    onSuccess: (updatedMethod) => {
      // Optimistically update the cache
      queryClient.setQueryData<PaymentMethod[]>(
        paymentMethodsKeys.byClient(updatedMethod.clientId),
        (oldMethods) => {
          if (!oldMethods) return oldMethods
          return oldMethods.map((method) => ({
            ...method,
            isDefault: method.id === updatedMethod.id,
          }))
        }
      )
      // Update the default payment method cache
      queryClient.setQueryData(
        paymentMethodsKeys.default(updatedMethod.clientId),
        updatedMethod
      )
      // Invalidate the client query as payment methods are stored on the client
      queryClient.invalidateQueries({
        queryKey: ['client', updatedMethod.clientId],
      })
    },
  })
}

/**
 * Hook to process a payment with a stored payment method
 */
export function useProcessPayment() {
  return useMutation({
    mutationFn: ({
      clientId,
      paymentMethodId,
      amount,
      currency = 'usd',
    }: {
      clientId: string
      paymentMethodId: string
      amount: number
      currency?: string
    }) => paymentMethodsApi.processPayment(clientId, paymentMethodId, amount, currency),
  })
}
