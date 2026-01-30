import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/authApi'
import type { User } from '../types'
import type { RolePermissions, StaffRole } from '@/modules/database/types'

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

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      userId: string
      role?: StaffRole
      permissionOverrides?: Partial<RolePermissions>
    }) => authApi.updateUserPermissions(params.userId, params),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['users'], (old: User[] | undefined) =>
        old?.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      )
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}
