import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { calendarApi } from '../api'
import { useToast } from '@/modules/ui/hooks/useToast'
import type { Appointment, AppointmentStatus, PaymentStatus } from '../types'

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

export function useAppointmentsByDay(date: Date, organizationId?: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['appointments', 'day', date.toISOString(), organizationId],
    queryFn: () => calendarApi.getByDay(date, organizationId),
    ...(options?.refetchInterval ? { refetchInterval: options.refetchInterval } : {}),
  })
}

export function useAppointmentsByWeek(date: Date, organizationId?: string) {
  return useQuery({
    queryKey: ['appointments', 'week', date.toISOString(), organizationId],
    queryFn: () => calendarApi.getByWeek(date, organizationId),
  })
}

export function useAppointmentsByView(
  view: 'day' | 'week' | 'month',
  date: Date,
  organizationId?: string
) {
  const { start, end } = useMemo(() => {
    if (view === 'day') {
      return { start: startOfDay(date), end: endOfDay(date) }
    }
    if (view === 'week') {
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 }),
      }
    }
    // month: fetch the full grid range that react-big-calendar / FullCalendar displays
    return {
      start: startOfWeek(startOfMonth(date), { weekStartsOn: 0 }),
      end: endOfWeek(endOfMonth(date), { weekStartsOn: 0 }),
    }
  }, [view, date])

  return useQuery({
    queryKey: ['appointments', 'view', view, start.toISOString(), end.toISOString(), organizationId],
    queryFn: () => calendarApi.getByDateRange(start, end, organizationId),
  })
}

export function useAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
  organizationId?: string,
  options?: { refetchInterval?: number }
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
    ...(options?.refetchInterval ? { refetchInterval: options.refetchInterval } : {}),
  })
}

export function useIssuesAppointments(
  startDate: Date,
  endDate: Date,
  organizationId?: string,
  options?: { refetchInterval?: number }
) {
  return useQuery({
    queryKey: [
      'appointments',
      'issues',
      startDate.toISOString(),
      endDate.toISOString(),
      organizationId,
    ],
    queryFn: () => calendarApi.getIssues(startDate, endDate, organizationId),
    ...(options?.refetchInterval ? { refetchInterval: options.refetchInterval } : {}),
  })
}

export function useClientAppointments(clientId: string, organizationId: string) {
  return useQuery({
    queryKey: ['appointments', 'client', clientId, organizationId],
    queryFn: () => calendarApi.getByClientId(clientId, organizationId),
    enabled: !!clientId && !!organizationId,
  })
}

export function useGroomerAppointments(groomerId: string, organizationId: string) {
  return useQuery({
    queryKey: ['appointments', 'groomer', groomerId, organizationId],
    queryFn: () => calendarApi.getByGroomerId(groomerId, organizationId),
    enabled: !!groomerId && !!organizationId,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) =>
      calendarApi.create(data),
    onSuccess: () => {
      showSuccess('Appointment created')
      queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['groomerAvailableSlots'], refetchType: 'active' })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      calendarApi.update(id, data),
    onSuccess: (updatedAppointment) => {
      showSuccess('Appointment updated')
      queryClient.setQueryData(
        ['appointment', updatedAppointment.id],
        updatedAppointment
      )
      queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['groomerAvailableSlots'], refetchType: 'active' })
    },
  })
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({ id, status, statusNotes }: { id: string; status: AppointmentStatus; statusNotes?: string }) =>
      calendarApi.updateStatus(id, status, statusNotes),
    onSuccess: (updatedAppointment) => {
      showSuccess('Status updated')
      queryClient.setQueryData(
        ['appointment', updatedAppointment.id],
        updatedAppointment
      )
      queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['groomerAvailableSlots'], refetchType: 'active' })
    },
  })
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) =>
      calendarApi.updatePaymentStatus(id, paymentStatus),
    onSuccess: (updatedAppointment) => {
      showSuccess('Payment status updated')
      queryClient.setQueryData(
        ['appointment', updatedAppointment.id],
        updatedAppointment
      )
      queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['groomerAvailableSlots'], refetchType: 'active' })
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (id: string) => calendarApi.delete(id),
    onSuccess: () => {
      showSuccess('Appointment deleted')
      queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['groomerAvailableSlots'], refetchType: 'active' })
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

/**
 * Hook to get available slots for a specific groomer with detailed availability info
 */
export function useGroomerAvailableSlots(
  groomerId: string | undefined,
  date: Date,
  durationMinutes: number,
  organizationId: string
) {
  return useQuery({
    queryKey: [
      'groomerAvailableSlots',
      groomerId,
      date.toISOString(),
      durationMinutes,
      organizationId,
    ],
    queryFn: () =>
      calendarApi.getGroomerAvailableSlots(groomerId!, date, durationMinutes, organizationId),
    enabled: !!groomerId && !!organizationId && durationMinutes > 0,
  })
}
