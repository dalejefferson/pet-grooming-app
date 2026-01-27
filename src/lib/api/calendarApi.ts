import type { Appointment, AppointmentStatus, TimeSlot } from '@/types'
import { getFromStorage, setToStorage, delay, generateId } from './storage'
import { seedAppointments } from './seed'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addMinutes,
  format,
  parseISO,
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

    // Business hours: 8 AM to 6 PM
    const startHour = 8
    const endHour = 18
    const slotInterval = 30 // 30-minute intervals

    const slots: TimeSlot[] = []
    let currentSlotStart = setMinutes(setHours(date, startHour), 0)
    const dayEnd = setMinutes(setHours(date, endHour), 0)

    while (addMinutes(currentSlotStart, durationMinutes) <= dayEnd) {
      const slotEnd = addMinutes(currentSlotStart, durationMinutes)

      // Check if this slot conflicts with any existing appointments
      const hasConflict = dayAppointments.some((apt) => {
        if (groomerId && apt.groomerId !== groomerId) return false
        if (apt.status === 'cancelled' || apt.status === 'no_show') return false

        const aptStart = parseISO(apt.startTime)
        const aptEnd = parseISO(apt.endTime)

        // Check for overlap
        return currentSlotStart < aptEnd && slotEnd > aptStart
      })

      slots.push({
        date: format(date, 'yyyy-MM-dd'),
        startTime: format(currentSlotStart, 'HH:mm'),
        endTime: format(slotEnd, 'HH:mm'),
        available: !hasConflict,
        groomerId,
      })

      currentSlotStart = addMinutes(currentSlotStart, slotInterval)
    }

    return slots
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
