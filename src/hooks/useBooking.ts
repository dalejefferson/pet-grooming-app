import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/lib/api'
import type { BookingState } from '@/types'

export function useCalculateAppointment() {
  return useMutation({
    mutationFn: (booking: BookingState) =>
      bookingApi.calculateAppointmentDetails(booking),
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (booking: BookingState) => bookingApi.createBooking(booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

export function useValidateTimeSlot() {
  return useMutation({
    mutationFn: ({
      date,
      startTime,
      durationMinutes,
      organizationId,
      groomerId,
    }: {
      date: string
      startTime: string
      durationMinutes: number
      organizationId: string
      groomerId?: string
    }) =>
      bookingApi.validateTimeSlot(
        date,
        startTime,
        durationMinutes,
        organizationId,
        groomerId
      ),
  })
}
