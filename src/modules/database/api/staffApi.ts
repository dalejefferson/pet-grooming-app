import type { StaffAvailability, TimeOffRequest, DaySchedule, DayOfWeek } from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { groomersApi } from './groomersApi'
import { parseISO, isWithinInterval, parse } from 'date-fns'

const AVAILABILITY_STORAGE_KEY = 'staff_availability'
const TIME_OFF_STORAGE_KEY = 'time_off_requests'

// Default weekly schedule (Mon-Fri 9-5, weekends off)
function createDefaultWeeklySchedule(): DaySchedule[] {
  return [
    { dayOfWeek: 0, isWorkingDay: false, startTime: '09:00', endTime: '17:00' }, // Sunday
    { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },  // Monday
    { dayOfWeek: 2, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },  // Tuesday
    { dayOfWeek: 3, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },  // Wednesday
    { dayOfWeek: 4, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },  // Thursday
    { dayOfWeek: 5, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },  // Friday
    { dayOfWeek: 6, isWorkingDay: false, startTime: '09:00', endTime: '17:00' }, // Saturday
  ]
}

// Seed data for staff availability - IDs match seed.ts user-X IDs
const seedAvailability: StaffAvailability[] = [
  {
    id: 'avail-1',
    staffId: 'user-2', // Mike Chen
    weeklySchedule: createDefaultWeeklySchedule(),
    maxAppointmentsPerDay: 8,
    bufferMinutesBetweenAppointments: 15,
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'avail-2',
    staffId: 'user-3', // Lisa Martinez
    weeklySchedule: [
      { dayOfWeek: 0, isWorkingDay: false, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 1, isWorkingDay: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, isWorkingDay: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, isWorkingDay: false, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, isWorkingDay: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, isWorkingDay: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 6, isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
    ],
    maxAppointmentsPerDay: 6,
    bufferMinutesBetweenAppointments: 10,
    updatedAt: '2024-02-01T10:00:00Z',
  },
]

// Seed data for time off requests - IDs match seed.ts user-X IDs
const seedTimeOffRequests: TimeOffRequest[] = [
  {
    id: 'timeoff-1',
    staffId: 'user-2', // Mike Chen
    startDate: '2024-12-23',
    endDate: '2024-12-27',
    reason: 'Holiday vacation',
    status: 'approved',
    createdAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 'timeoff-2',
    staffId: 'user-3', // Lisa Martinez
    startDate: '2024-12-30',
    endDate: '2024-12-31',
    reason: 'Personal day',
    status: 'pending',
    createdAt: '2024-12-01T10:00:00Z',
  },
]

function getAvailabilities(): StaffAvailability[] {
  return getFromStorage<StaffAvailability[]>(AVAILABILITY_STORAGE_KEY, seedAvailability)
}

function saveAvailabilities(availabilities: StaffAvailability[]): void {
  setToStorage(AVAILABILITY_STORAGE_KEY, availabilities)
}

function getTimeOffRequestsList(): TimeOffRequest[] {
  return getFromStorage<TimeOffRequest[]>(TIME_OFF_STORAGE_KEY, seedTimeOffRequests)
}

function saveTimeOffRequests(requests: TimeOffRequest[]): void {
  setToStorage(TIME_OFF_STORAGE_KEY, requests)
}

export interface StaffPerformanceInput {
  staffId: string
  startDate?: string
  endDate?: string
}

export const staffApi = {
  // Re-export groomer functions for convenience
  getAll: groomersApi.getAll.bind(groomersApi),
  getById: groomersApi.getById.bind(groomersApi),
  create: groomersApi.create.bind(groomersApi),
  update: groomersApi.update.bind(groomersApi),
  delete: groomersApi.delete.bind(groomersApi),

  // Staff availability functions
  async getStaffAvailability(staffId: string): Promise<StaffAvailability | null> {
    await delay()
    const availabilities = getAvailabilities()
    const existing = availabilities.find((a) => a.staffId === staffId)

    if (existing) {
      return existing
    }

    // If no availability exists, create a default one
    const newAvailability: StaffAvailability = {
      id: generateId(),
      staffId,
      weeklySchedule: createDefaultWeeklySchedule(),
      maxAppointmentsPerDay: 8,
      bufferMinutesBetweenAppointments: 15,
      updatedAt: new Date().toISOString(),
    }

    availabilities.push(newAvailability)
    saveAvailabilities(availabilities)

    return newAvailability
  },

  async updateStaffAvailability(
    staffId: string,
    availability: Partial<Omit<StaffAvailability, 'id' | 'staffId' | 'updatedAt'>>
  ): Promise<StaffAvailability> {
    await delay()
    const availabilities = getAvailabilities()
    const index = availabilities.findIndex((a) => a.staffId === staffId)

    if (index === -1) {
      // Create new availability if it doesn't exist
      const newAvailability: StaffAvailability = {
        id: generateId(),
        staffId,
        weeklySchedule: availability.weeklySchedule ?? createDefaultWeeklySchedule(),
        maxAppointmentsPerDay: availability.maxAppointmentsPerDay ?? 8,
        bufferMinutesBetweenAppointments: availability.bufferMinutesBetweenAppointments ?? 15,
        updatedAt: new Date().toISOString(),
      }
      availabilities.push(newAvailability)
      saveAvailabilities(availabilities)
      return newAvailability
    }

    availabilities[index] = {
      ...availabilities[index],
      ...availability,
      updatedAt: new Date().toISOString(),
    }
    saveAvailabilities(availabilities)
    return availabilities[index]
  },

  // Time off request functions
  async getTimeOffRequests(staffId?: string): Promise<TimeOffRequest[]> {
    await delay()
    const requests = getTimeOffRequestsList()
    if (staffId) {
      return requests.filter((r) => r.staffId === staffId)
    }
    return requests
  },

  async getTimeOffRequestById(id: string): Promise<TimeOffRequest | null> {
    await delay()
    const requests = getTimeOffRequestsList()
    return requests.find((r) => r.id === id) ?? null
  },

  async createTimeOffRequest(
    staffId: string,
    request: Omit<TimeOffRequest, 'id' | 'staffId' | 'status' | 'createdAt'>
  ): Promise<TimeOffRequest> {
    await delay()
    const requests = getTimeOffRequestsList()
    const newRequest: TimeOffRequest = {
      ...request,
      id: generateId(),
      staffId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    requests.push(newRequest)
    saveTimeOffRequests(requests)
    return newRequest
  },

  async updateTimeOffRequest(
    id: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<TimeOffRequest> {
    await delay()
    const requests = getTimeOffRequestsList()
    const index = requests.findIndex((r) => r.id === id)

    if (index === -1) {
      throw new Error('Time off request not found')
    }

    requests[index] = {
      ...requests[index],
      status,
    }
    saveTimeOffRequests(requests)
    return requests[index]
  },

  async deleteTimeOffRequest(id: string): Promise<void> {
    await delay()
    const requests = getTimeOffRequestsList()
    const filtered = requests.filter((r) => r.id !== id)
    saveTimeOffRequests(filtered)
  },

  // Availability check function
  async isStaffAvailable(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    await delay()

    // Get staff availability settings
    const availability = await this.getStaffAvailability(staffId)
    if (!availability) {
      return false
    }

    // Check if it's a working day
    const dateObj = parseISO(date)
    const dayOfWeek = dateObj.getDay() as DayOfWeek
    const daySchedule = availability.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek)

    if (!daySchedule || !daySchedule.isWorkingDay) {
      return false
    }

    // Check if the requested time is within working hours
    const requestedStart = parse(startTime, 'HH:mm', dateObj)
    const requestedEnd = parse(endTime, 'HH:mm', dateObj)
    const workStart = parse(daySchedule.startTime, 'HH:mm', dateObj)
    const workEnd = parse(daySchedule.endTime, 'HH:mm', dateObj)

    if (requestedStart < workStart || requestedEnd > workEnd) {
      return false
    }

    // Check if there's a break during the requested time
    if (daySchedule.breakStart && daySchedule.breakEnd) {
      const breakStart = parse(daySchedule.breakStart, 'HH:mm', dateObj)
      const breakEnd = parse(daySchedule.breakEnd, 'HH:mm', dateObj)

      // Check for overlap with break
      if (requestedStart < breakEnd && requestedEnd > breakStart) {
        return false
      }
    }

    // Check for time off
    const timeOffRequests = await this.getTimeOffRequests(staffId)
    const approvedTimeOff = timeOffRequests.filter((r) => r.status === 'approved')

    for (const timeOff of approvedTimeOff) {
      const timeOffStart = parseISO(timeOff.startDate)
      const timeOffEnd = parseISO(timeOff.endDate)

      // Set time to cover the full day
      timeOffStart.setHours(0, 0, 0, 0)
      timeOffEnd.setHours(23, 59, 59, 999)

      if (isWithinInterval(dateObj, { start: timeOffStart, end: timeOffEnd })) {
        return false
      }
    }

    return true
  },

  // Get all staff with their availability
  async getAllWithAvailability(organizationId?: string): Promise<Array<{
    groomer: Awaited<ReturnType<typeof groomersApi.getById>>
    availability: StaffAvailability | null
    timeOffRequests: TimeOffRequest[]
  }>> {
    await delay()
    const groomers = await groomersApi.getAll(organizationId)

    const result = await Promise.all(
      groomers.map(async (groomer) => ({
        groomer,
        availability: await this.getStaffAvailability(groomer.id),
        timeOffRequests: await this.getTimeOffRequests(groomer.id),
      }))
    )

    return result
  },
}
