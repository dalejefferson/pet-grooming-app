import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffApi } from '../api/staffApi'
import { useOrganization } from './useOrganization'
import { useToast } from '@/modules/ui/hooks/useToast'
import type { StaffAvailability, TimeOffRequest, DaySchedule } from '../types'

// ============================================
// Staff Availability Hooks
// ============================================

export function useStaffAvailability(staffId: string) {
  return useQuery({
    queryKey: ['staffAvailability', staffId],
    queryFn: () => staffApi.getStaffAvailability(staffId),
    enabled: !!staffId,
  })
}

export function useUpdateStaffAvailability() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({
      staffId,
      availability,
    }: {
      staffId: string
      availability: Partial<Omit<StaffAvailability, 'id' | 'staffId' | 'updatedAt'>>
    }) => staffApi.updateStaffAvailability(staffId, availability),
    onSuccess: (updatedAvailability) => {
      showSuccess('Availability updated')
      queryClient.setQueryData(
        ['staffAvailability', updatedAvailability.staffId],
        updatedAvailability
      )
      queryClient.invalidateQueries({ queryKey: ['staffAvailability'] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}

export function useUpdateDaySchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      staffId,
      daySchedule,
    }: {
      staffId: string
      daySchedule: DaySchedule
    }) => {
      const current = await staffApi.getStaffAvailability(staffId)
      if (!current) {
        throw new Error('Staff availability not found')
      }

      const updatedSchedule = current.weeklySchedule.map((d) =>
        d.dayOfWeek === daySchedule.dayOfWeek ? daySchedule : d
      )

      return staffApi.updateStaffAvailability(staffId, {
        weeklySchedule: updatedSchedule,
      })
    },
    onSuccess: (updatedAvailability) => {
      queryClient.setQueryData(
        ['staffAvailability', updatedAvailability.staffId],
        updatedAvailability
      )
      queryClient.invalidateQueries({ queryKey: ['staffAvailability'] })
    },
  })
}

// ============================================
// Time Off Request Hooks
// ============================================

export function useTimeOffRequests(staffId?: string) {
  return useQuery({
    queryKey: ['timeOffRequests', staffId],
    queryFn: () => staffApi.getTimeOffRequests(staffId),
  })
}

export function useTimeOffRequest(id: string) {
  return useQuery({
    queryKey: ['timeOffRequest', id],
    queryFn: () => staffApi.getTimeOffRequestById(id),
    enabled: !!id,
  })
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({
      staffId,
      request,
    }: {
      staffId: string
      request: Omit<TimeOffRequest, 'id' | 'staffId' | 'status' | 'createdAt'>
    }) => staffApi.createTimeOffRequest(staffId, request),
    onSuccess: (newRequest) => {
      showSuccess('Time off requested')
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests'] })
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests', newRequest.staffId] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}

export function useUpdateTimeOffRequest() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'approved' | 'rejected'
    }) => staffApi.updateTimeOffRequest(id, status),
    onSuccess: (updatedRequest) => {
      showSuccess('Time off request updated')
      queryClient.setQueryData(['timeOffRequest', updatedRequest.id], updatedRequest)
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests'] })
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests', updatedRequest.staffId] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}

export function useDeleteTimeOffRequest() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (id: string) => staffApi.deleteTimeOffRequest(id),
    onSuccess: () => {
      showSuccess('Time off request deleted')
      queryClient.invalidateQueries({ queryKey: ['timeOffRequests'] })
      queryClient.invalidateQueries({ queryKey: ['allStaffWithAvailability'] })
    },
  })
}

// ============================================
// Staff Availability Check Hooks
// ============================================

export function useIsStaffAvailable(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: ['isStaffAvailable', staffId, date, startTime, endTime],
    queryFn: () => staffApi.isStaffAvailable(staffId, date, startTime, endTime),
    enabled: !!staffId && !!date && !!startTime && !!endTime,
  })
}

export function useCheckStaffAvailability() {
  return useMutation({
    mutationFn: ({
      staffId,
      date,
      startTime,
      endTime,
    }: {
      staffId: string
      date: string
      startTime: string
      endTime: string
    }) => staffApi.isStaffAvailable(staffId, date, startTime, endTime),
  })
}

// ============================================
// Combined Staff Data Hooks
// ============================================

export function useAllStaffWithAvailability() {
  const { data: organization } = useOrganization()
  const organizationId = organization?.id

  return useQuery({
    queryKey: ['allStaffWithAvailability', organizationId],
    queryFn: () => staffApi.getAllWithAvailability(organizationId),
    enabled: !!organizationId,
  })
}

// ============================================
// Pending Time Off Requests Hook
// ============================================

export function usePendingTimeOffRequests() {
  const { data: allRequests, ...rest } = useTimeOffRequests()

  const pendingRequests = allRequests?.filter((r) => r.status === 'pending') ?? []

  return {
    ...rest,
    data: pendingRequests,
    pendingCount: pendingRequests.length,
  }
}
