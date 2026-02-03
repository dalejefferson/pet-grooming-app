import { QueryClient, MutationCache } from '@tanstack/react-query'

let toastCallback: ((title: string, message?: string) => void) | null = null

export function setGlobalErrorToast(callback: typeof toastCallback) {
  toastCallback = callback
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (toastCallback) {
        toastCallback(
          'Operation Failed',
          error instanceof Error ? error.message : 'An unexpected error occurred'
        )
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
