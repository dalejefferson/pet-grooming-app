import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarApi } from '@/lib/api'
import type { Appointment, AppointmentStatus } from '@/types'

export function useAppointments(organizationId?: string) {
  return useQuery({
    queryKey: ['appointments', organizationId],
    queryFn: () => calendarApi.getAll(organizationId),
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => calendarApi.getById(id),
    enabled: !!id,
  })
}

export function useAppointmentsByDay(date: Date, organizationId?: string) {
  return useQuery({
    queryKey: ['appointments', 'day', date.toISOString(), organizationId],
    queryFn: () => calendarApi.getByDay(date, organizationId),
  })
}

export function useAppointmentsByWeek(date: Date, organizationId?: string) {
  return useQuery({
    queryKey: ['appointments', 'week', date.toISOString(), organizationId],
    queryFn: () => calendarApi.getByWeek(date, organizationId),
  })
}

export function useAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
  organizationId?: string
) {
  return useQuery({
    queryKey: [
      'appointments',
      'range',
      startDate.toISOString(),
      endDate.toISOString(),
      organizationId,
    ],
    queryFn: () => calendarApi.getByDateRange(startDate, endDate, organizationId),
  })
}

export function useClientAppointments(clientId: string) {
  return useQuery({
    queryKey: ['appointments', 'client', clientId],
    queryFn: () => calendarApi.getByClientId(clientId),
    enabled: !!clientId,
  })
}

export function useGroomerAppointments(groomerId: string) {
  return useQuery({
    queryKey: ['appointments', 'groomer', groomerId],
    queryFn: () => calendarApi.getByGroomerId(groomerId),
    enabled: !!groomerId,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) =>
      calendarApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      calendarApi.update(id, data),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        ['appointment', updatedAppointment.id],
        updatedAppointment
      )
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, statusNotes }: { id: string; status: AppointmentStatus; statusNotes?: string }) =>
      calendarApi.updateStatus(id, status, statusNotes),
    onSuccess: (updatedAppointment) => {
      queryClient.setQueryData(
        ['appointment', updatedAppointment.id],
        updatedAppointment
      )
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => calendarApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useAvailableSlots(
  date: Date,
  durationMinutes: number,
  organizationId: string,
  groomerId?: string
) {
  return useQuery({
    queryKey: [
      'availableSlots',
      date.toISOString(),
      durationMinutes,
      organizationId,
      groomerId,
    ],
    queryFn: () =>
      calendarApi.getAvailableSlots(date, durationMinutes, organizationId, groomerId),
    enabled: !!organizationId && durationMinutes > 0,
  })
}

export function useAvailableSlotsForWeek(
  startDate: Date,
  durationMinutes: number,
  organizationId: string,
  groomerId?: string
) {
  return useQuery({
    queryKey: [
      'availableSlots',
      'week',
      startDate.toISOString(),
      durationMinutes,
      organizationId,
      groomerId,
    ],
    queryFn: () =>
      calendarApi.getAvailableSlotsForWeek(
        startDate,
        durationMinutes,
        organizationId,
        groomerId
      ),
    enabled: !!organizationId && durationMinutes > 0,
  })
}
