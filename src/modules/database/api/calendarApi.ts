import type { Appointment, AppointmentPet, AppointmentStatus, PaymentStatus, TimeSlot, DayOfWeek, StaffAvailability } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapAppointment, toDbAppointment } from '../types/supabase-mappers'
import { staffApi } from './staffApi'
import { policiesApi } from './policiesApi'
import { validateStatusTransition } from './statusMachine'
import { validateCancellationWindow } from './validators'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addMinutes,
  format,
  parseISO,
  parse,
  isWithinInterval,
  setHours,
  setMinutes,
  addDays,
} from 'date-fns'

/**
 * Load appointment_pets and their nested appointment_services for a given appointment.
 */
async function loadAppointmentPets(appointmentId: string): Promise<AppointmentPet[]> {
  const { data: aptPets, error: petsError } = await supabase
    .from('appointment_pets')
    .select('*')
    .eq('appointment_id', appointmentId)
  if (petsError) throw petsError

  const result: AppointmentPet[] = []
  for (const aptPet of aptPets ?? []) {
    const { data: aptServices, error: svcError } = await supabase
      .from('appointment_services')
      .select('*')
      .eq('appointment_pet_id', aptPet.id)
    if (svcError) throw svcError

    result.push({
      petId: aptPet.pet_id,
      services: (aptServices ?? []).map((svc) => ({
        serviceId: svc.service_id,
        appliedModifiers: svc.applied_modifier_ids ?? [],
        finalDuration: svc.final_duration,
        finalPrice: Number(svc.final_price),
      })),
    })
  }

  return result
}

/**
 * Load a single appointment row and hydrate with nested pets/services.
 */
async function hydrateAppointment(row: Record<string, unknown>): Promise<Appointment> {
  const pets = await loadAppointmentPets(row.id as string)
  return mapAppointment(row, pets)
}

export const calendarApi = {
  async getAll(organizationId?: string): Promise<Appointment[]> {
    let query = supabase.from('appointments').select('*')
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    const { data, error } = await query
    if (error) throw error
    return Promise.all((data ?? []).map(hydrateAppointment))
  },

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return hydrateAppointment(data)
  },

  async getByDateRange(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<Appointment[]> {
    let query = supabase
      .from('appointments')
      .select('*')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    const { data, error } = await query
    if (error) throw error
    return Promise.all((data ?? []).map(hydrateAppointment))
  },

  async getIssues(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<Appointment[]> {
    let query = supabase
      .from('appointments')
      .select('*')
      .in('status', ['cancelled', 'no_show'])
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString())
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    const { data, error } = await query
    if (error) throw error
    return Promise.all((data ?? []).map(hydrateAppointment))
  },

  async getByDay(date: Date, organizationId?: string): Promise<Appointment[]> {
    return this.getByDateRange(startOfDay(date), endOfDay(date), organizationId)
  },

  async getByWeek(date: Date, organizationId?: string): Promise<Appointment[]> {
    return this.getByDateRange(
      startOfWeek(date, { weekStartsOn: 0 }),
      endOfWeek(date, { weekStartsOn: 0 }),
      organizationId
    )
  },

  async getByClientId(clientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
    if (error) throw error
    return Promise.all((data ?? []).map(hydrateAppointment))
  },

  async getByGroomerId(groomerId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('groomer_id', groomerId)
    if (error) throw error
    return Promise.all((data ?? []).map(hydrateAppointment))
  },

  async create(
    data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    // Validate groomer exists and is active before creating appointment
    if (data.groomerId) {
      const { data: groomer, error: groomerError } = await supabase
        .from('groomers')
        .select('id, is_active')
        .eq('id', data.groomerId)
        .single()

      if (groomerError || !groomer) {
        throw new Error('Groomer not found')
      }
      if (groomer.is_active === false) {
        throw new Error('Groomer is not active')
      }
    }

    // 1. Insert the appointment row (without pets)
    const aptRow = toDbAppointment(data)
    const { data: inserted, error: aptError } = await supabase
      .from('appointments')
      .insert(aptRow)
      .select()
      .single()
    if (aptError) throw aptError

    const appointmentId = inserted.id as string

    // 2. For each pet, insert into appointment_pets, then services
    for (const pet of data.pets) {
      const { data: aptPet, error: petError } = await supabase
        .from('appointment_pets')
        .insert({
          appointment_id: appointmentId,
          pet_id: pet.petId,
        })
        .select()
        .single()
      if (petError) throw petError

      const aptPetId = aptPet.id as string

      // 3. For each service in that pet, insert into appointment_services
      for (const svc of pet.services) {
        const { error: svcError } = await supabase
          .from('appointment_services')
          .insert({
            appointment_pet_id: aptPetId,
            service_id: svc.serviceId,
            applied_modifier_ids: svc.appliedModifiers,
            final_duration: svc.finalDuration,
            final_price: svc.finalPrice,
          })
        if (svcError) throw svcError
      }
    }

    // Return the full appointment with nested data
    return hydrateAppointment(inserted)
  },

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const row = toDbAppointment(data)
    const { data: updated, error } = await supabase
      .from('appointments')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return hydrateAppointment(updated)
  },

  async updateStatus(id: string, status: AppointmentStatus, statusNotes?: string): Promise<Appointment> {
    const appointment = await this.getById(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }
    validateStatusTransition(appointment.status, status)

    // Enforce cancellation window when transitioning to cancelled
    if (status === 'cancelled') {
      const policies = await policiesApi.get(appointment.organizationId)
      if (policies) {
        const { canCancel, reason } = validateCancellationWindow(appointment, policies)
        if (!canCancel) {
          throw new Error(reason || 'Cancellation is not allowed')
        }
      }
    }

    return this.update(id, { status, statusNotes })
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Appointment> {
    const appointment = await this.getById(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }
    return this.update(id, { paymentStatus })
  },

  async delete(id: string): Promise<void> {
    // Cascading deletes should handle appointment_pets -> appointment_services
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  },

  async getAvailableSlots(
    date: Date,
    durationMinutes: number,
    organizationId: string,
    groomerId?: string
  ): Promise<TimeSlot[]> {
    const dayAppointments = await this.getByDay(date, organizationId)

    // Default business hours: 8 AM to 6 PM
    let startHour = 8
    let endHour = 18
    const slotInterval = 30 // 30-minute intervals

    // Get groomer availability if a specific groomer is selected
    let groomerAvailability: StaffAvailability | null = null
    let daySchedule = null
    let groomerHasTimeOff = false

    if (groomerId) {
      groomerAvailability = await staffApi.getStaffAvailability(groomerId)
      if (groomerAvailability) {
        const dayOfWeek = date.getDay() as DayOfWeek
        daySchedule = groomerAvailability.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek)

        // Check if groomer is working on this day
        if (!daySchedule || !daySchedule.isWorkingDay) {
          // Groomer doesn't work on this day, return empty slots
          return []
        }

        // Use groomer's working hours
        const [startH] = daySchedule.startTime.split(':').map(Number)
        const [endH] = daySchedule.endTime.split(':').map(Number)
        startHour = startH
        endHour = endH
      }

      // Check for approved time off
      const timeOffRequests = await staffApi.getTimeOffRequests(groomerId)
      const approvedTimeOff = timeOffRequests.filter((r) => r.status === 'approved')

      for (const timeOff of approvedTimeOff) {
        const timeOffStart = parseISO(timeOff.startDate)
        const timeOffEnd = parseISO(timeOff.endDate)
        timeOffStart.setHours(0, 0, 0, 0)
        timeOffEnd.setHours(23, 59, 59, 999)

        if (isWithinInterval(date, { start: timeOffStart, end: timeOffEnd })) {
          groomerHasTimeOff = true
          break
        }
      }

      // If groomer has time off, return empty slots
      if (groomerHasTimeOff) {
        return []
      }
    }

    const slots: TimeSlot[] = []
    let currentSlotStart = setMinutes(setHours(date, startHour), 0)
    const dayEnd = setMinutes(setHours(date, endHour), 0)

    while (addMinutes(currentSlotStart, durationMinutes) <= dayEnd) {
      const slotEnd = addMinutes(currentSlotStart, durationMinutes)
      const slotStartTime = format(currentSlotStart, 'h:mm a')
      const slotEndTime = format(slotEnd, 'h:mm a')

      // Check if this slot conflicts with any existing appointments
      const hasConflict = dayAppointments.some((apt) => {
        if (groomerId && apt.groomerId !== groomerId) return false
        if (apt.status === 'cancelled' || apt.status === 'no_show') return false

        const aptStart = parseISO(apt.startTime)
        const aptEnd = parseISO(apt.endTime)

        // Check for overlap
        return currentSlotStart < aptEnd && slotEnd > aptStart
      })

      // Check if slot overlaps with groomer's break time
      let isDuringBreak = false
      if (groomerId && daySchedule && daySchedule.breakStart && daySchedule.breakEnd) {
        const breakStart = parse(daySchedule.breakStart, 'HH:mm', date)
        const breakEnd = parse(daySchedule.breakEnd, 'HH:mm', date)

        // Check for overlap with break
        if (currentSlotStart < breakEnd && slotEnd > breakStart) {
          isDuringBreak = true
        }
      }

      // Check buffer time between appointments
      let hasBufferConflict = false
      if (groomerId && groomerAvailability) {
        const bufferMinutes = groomerAvailability.bufferMinutesBetweenAppointments
        hasBufferConflict = dayAppointments.some((apt) => {
          if (apt.groomerId !== groomerId) return false
          if (apt.status === 'cancelled' || apt.status === 'no_show') return false
          const aptEnd = parseISO(apt.endTime)
          const aptStart = parseISO(apt.startTime)
          const bufferEnd = addMinutes(aptEnd, bufferMinutes)
          const bufferStart = addMinutes(aptStart, -bufferMinutes)
          return currentSlotStart < bufferEnd && slotEnd > bufferStart
        })
      }

      slots.push({
        date: format(date, 'yyyy-MM-dd'),
        startTime: slotStartTime,
        endTime: slotEndTime,
        available: !hasConflict && !isDuringBreak && !hasBufferConflict,
        groomerId,
      })

      currentSlotStart = addMinutes(currentSlotStart, slotInterval)
    }

    return slots
  },

  /**
   * Get available slots specifically for a groomer on a given date
   * Returns information about their working hours and any time off
   */
  async getGroomerAvailableSlots(
    groomerId: string,
    date: Date,
    durationMinutes: number = 60,
    organizationId: string
  ): Promise<{
    slots: TimeSlot[]
    workingHours: { start: string; end: string } | null
    hasTimeOff: boolean
    isWorkingDay: boolean
    breakTime: { start: string; end: string } | null
  }> {
    // Get groomer availability
    const groomerAvailability = await staffApi.getStaffAvailability(groomerId)
    if (!groomerAvailability) {
      return {
        slots: [],
        workingHours: null,
        hasTimeOff: false,
        isWorkingDay: false,
        breakTime: null,
      }
    }

    const dayOfWeek = date.getDay() as DayOfWeek
    const daySchedule = groomerAvailability.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek)

    // Check if it's a working day
    if (!daySchedule || !daySchedule.isWorkingDay) {
      return {
        slots: [],
        workingHours: null,
        hasTimeOff: false,
        isWorkingDay: false,
        breakTime: null,
      }
    }

    // Check for approved time off
    const timeOffRequests = await staffApi.getTimeOffRequests(groomerId)
    const approvedTimeOff = timeOffRequests.filter((r) => r.status === 'approved')

    let hasTimeOff = false
    for (const timeOff of approvedTimeOff) {
      const timeOffStart = parseISO(timeOff.startDate)
      const timeOffEnd = parseISO(timeOff.endDate)
      timeOffStart.setHours(0, 0, 0, 0)
      timeOffEnd.setHours(23, 59, 59, 999)

      if (isWithinInterval(date, { start: timeOffStart, end: timeOffEnd })) {
        hasTimeOff = true
        break
      }
    }

    if (hasTimeOff) {
      return {
        slots: [],
        workingHours: { start: daySchedule.startTime, end: daySchedule.endTime },
        hasTimeOff: true,
        isWorkingDay: true,
        breakTime: daySchedule.breakStart && daySchedule.breakEnd
          ? { start: daySchedule.breakStart, end: daySchedule.breakEnd }
          : null,
      }
    }

    // Get available slots respecting groomer's schedule
    const slots = await this.getAvailableSlots(date, durationMinutes, organizationId, groomerId)

    return {
      slots,
      workingHours: { start: daySchedule.startTime, end: daySchedule.endTime },
      hasTimeOff: false,
      isWorkingDay: true,
      breakTime: daySchedule.breakStart && daySchedule.breakEnd
        ? { start: daySchedule.breakStart, end: daySchedule.breakEnd }
        : null,
    }
  },

  async getAvailableSlotsForWeek(
    startDate: Date,
    durationMinutes: number,
    organizationId: string,
    groomerId?: string
  ): Promise<Record<string, TimeSlot[]>> {
    const result: Record<string, TimeSlot[]> = {}

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      result[dateStr] = await this.getAvailableSlots(
        date,
        durationMinutes,
        organizationId,
        groomerId
      )
    }

    return result
  },
}
