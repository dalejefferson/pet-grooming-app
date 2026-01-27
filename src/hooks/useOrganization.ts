import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orgApi } from '@/lib/api'
import type { Organization } from '@/types'

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: () => orgApi.getCurrent(),
  })
}

export function useOrganizationBySlug(slug: string) {
  return useQuery({
    queryKey: ['organization', 'slug', slug],
    queryFn: () => orgApi.getBySlug(slug),
    enabled: !!slug,
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
      orgApi.update(id, data),
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(['organization'], updatedOrg)
    },
  })
}
