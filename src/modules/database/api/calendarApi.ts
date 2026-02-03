import type { Appointment, AppointmentStatus, TimeSlot, DayOfWeek, StaffAvailability } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { seedAppointments } from '../seed/seed'
import { staffApi } from './staffApi'
import { validateStatusTransition } from './statusMachine'
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

const STORAGE_KEY = 'appointments'

function getAppointments(): Appointment[] {
  return getFromStorage<Appointment[]>(STORAGE_KEY, seedAppointments)
}

function saveAppointments(appointments: Appointment[]): void {
  setToStorage(STORAGE_KEY, appointments)
}

export const calendarApi = {
  async getAll(organizationId?: string): Promise<Appointment[]> {
    await delay()
    const appointments = getAppointments()
    if (organizationId) {
      return appointments.filter((a) => a.organizationId === organizationId)
    }
    return appointments
  },

  async getById(id: string): Promise<Appointment | null> {
    await delay()
    const appointments = getAppointments()
    return appointments.find((a) => a.id === id) ?? null
  },

  async getByDateRange(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<Appointment[]> {
    await delay()
    const appointments = getAppointments()
    return appointments.filter((a) => {
      if (organizationId && a.organizationId !== organizationId) return false
      const aptStart = parseISO(a.startTime)
      return isWithinInterval(aptStart, { start: startDate, end: endDate })
    })
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
    await delay()
    const appointments = getAppointments()
    return appointments.filter((a) => a.clientId === clientId)
  },

  async getByGroomerId(groomerId: string): Promise<Appointment[]> {
    await delay()
    const appointments = getAppointments()
    return appointments.filter((a) => a.groomerId === groomerId)
  },

  async create(
    data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    await delay()
    const appointments = getAppointments()
    const now = new Date().toISOString()
    const newAppointment: Appointment = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    appointments.push(newAppointment)
    saveAppointments(appointments)
    return newAppointment
  },

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    await delay()
    const appointments = getAppointments()
    const index = appointments.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error('Appointment not found')
    }
    appointments[index] = {
      ...appointments[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveAppointments(appointments)
    return appointments[index]
  },

  async updateStatus(id: string, status: AppointmentStatus, statusNotes?: string): Promise<Appointment> {
    await delay()
    const appointment = await this.getById(id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }
    validateStatusTransition(appointment.status, status)
    return this.update(id, { status, statusNotes })
  },

  async delete(id: string): Promise<void> {
    await delay()
    const appointments = getAppointments()
    const filtered = appointments.filter((a) => a.id !== id)
    saveAppointments(filtered)
  },

  async getAvailableSlots(
    date: Date,
    durationMinutes: number,
    organizationId: string,
    groomerId?: string
  ): Promise<TimeSlot[]> {
    await delay()
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
      const slotStartTime = format(currentSlotStart, 'HH:mm')
      const slotEndTime = format(slotEnd, 'HH:mm')

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
    await delay()

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
    await delay()
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
