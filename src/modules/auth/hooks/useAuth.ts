import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import type { User } from '../types'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getCurrentUser(),
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['currentUser'], user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null)
      queryClient.clear()
    },
  })
}
