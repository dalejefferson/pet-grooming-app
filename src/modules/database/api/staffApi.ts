import type { Groomer, StaffAvailability, TimeOffRequest, DaySchedule, DayOfWeek } from '../types'
import { supabase } from '@/lib/supabase/client'
import {
  mapGroomer,
  toDbGroomer,
  mapStaffAvailability,
  toDbStaffAvailability,
  mapTimeOffRequest,
  toDbTimeOffRequest,
} from '../types/supabase-mappers'
import { parseISO, isWithinInterval, parse } from 'date-fns'
import { TIER_STAFF_LIMITS } from '@/config/subscriptionGates'

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

export interface StaffPerformanceInput {
  staffId: string
  startDate?: string
  endDate?: string
}

/**
 * Load a groomer row and hydrate with availability + time-off.
 */
async function hydrateGroomer(row: Record<string, unknown>): Promise<Groomer> {
  const availability = await staffApi.getStaffAvailability(row.id as string)
  const timeOff = await staffApi.getTimeOffRequests(row.id as string)
  return mapGroomer(row, availability ?? undefined, timeOff)
}

/**
 * Batch-hydrate multiple groomer rows using 2 bulk queries instead of N+1.
 */
async function batchHydrateGroomers(rows: Record<string, unknown>[]): Promise<Groomer[]> {
  const ids = rows.map(r => r.id as string)
  if (ids.length === 0) return []

  // Fetch all availability in one query
  const { data: allAvail, error: availError } = await supabase
    .from('staff_availability')
    .select('*')
    .in('staff_id', ids)
  if (availError) throw availError

  // Fetch all time-off in one query
  const { data: allTimeOff, error: toError } = await supabase
    .from('time_off_requests')
    .select('*')
    .in('staff_id', ids)
  if (toError) throw toError

  const availMap = new Map<string, StaffAvailability>()
  for (const row of allAvail ?? []) {
    availMap.set(row.staff_id, mapStaffAvailability(row))
  }

  const timeOffMap = new Map<string, TimeOffRequest[]>()
  for (const row of allTimeOff ?? []) {
    const existing = timeOffMap.get(row.staff_id) ?? []
    existing.push(mapTimeOffRequest(row))
    timeOffMap.set(row.staff_id, existing)
  }

  return rows.map(row => {
    const id = row.id as string
    return mapGroomer(row, availMap.get(id) ?? undefined, timeOffMap.get(id) ?? [])
  })
}

export const staffApi = {
  // =============================================
  // Groomer CRUD (previously delegated to groomersApi)
  // =============================================

  async getAll(organizationId?: string): Promise<Groomer[]> {
    let query = supabase.from('groomers').select('*')
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    const { data, error } = await query
    if (error) throw error
    return batchHydrateGroomers(data ?? [])
  },

  async getById(id: string): Promise<Groomer | null> {
    const { data, error } = await supabase
      .from('groomers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return hydrateGroomer(data)
  },

  async getByUserId(userId: string): Promise<Groomer | null> {
    const { data, error } = await supabase
      .from('groomers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return hydrateGroomer(data)
  },

  async create(data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Groomer> {
    // Enforce staff limit per subscription tier
    const { count, error: countError } = await supabase
      .from('groomers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', data.organizationId)
    if (countError) throw countError

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_tier, status')
      .eq('organization_id', data.organizationId)
      .in('status', ['trialing', 'active', 'past_due'])
      .maybeSingle()
    if (subError) throw subError

    const tier = sub?.plan_tier as 'solo' | 'studio' | null ?? null
    const limit = tier ? TIER_STAFF_LIMITS[tier] : 1
    if ((count ?? 0) >= limit) {
      throw new Error('Staff limit reached for your plan. Upgrade to Studio for unlimited staff.')
    }

    const row = toDbGroomer(data)
    const { data: inserted, error } = await supabase
      .from('groomers')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return hydrateGroomer(inserted)
  },

  async update(id: string, data: Partial<Groomer>): Promise<Groomer> {
    const row = toDbGroomer(data)
    const { data: updated, error } = await supabase
      .from('groomers')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return hydrateGroomer(updated)
  },

  async delete(id: string): Promise<void> {
    // 1. Unassign this groomer from all appointments (set groomer_id to null)
    const { error: unassignError } = await supabase
      .from('appointments')
      .update({ groomer_id: null })
      .eq('groomer_id', id)
    if (unassignError) throw unassignError

    // 2. Delete staff_availability rows for this staff member
    const { error: availError } = await supabase
      .from('staff_availability')
      .delete()
      .eq('staff_id', id)
    if (availError) throw availError

    // 3. Delete time_off_requests rows for this staff member
    const { error: timeOffError } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('staff_id', id)
    if (timeOffError) throw timeOffError

    // 4. Delete the groomer/staff record
    const { error } = await supabase.from('groomers').delete().eq('id', id)
    if (error) throw error
  },

  // =============================================
  // Staff availability
  // =============================================

  async getStaffAvailability(staffId: string): Promise<StaffAvailability | null> {
    const { data, error } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staffId)
      .maybeSingle()
    if (error) throw error

    if (data) {
      return mapStaffAvailability(data)
    }

    // If no availability exists, create a default one
    const defaultRow = toDbStaffAvailability({
      staffId,
      weeklySchedule: createDefaultWeeklySchedule(),
      maxAppointmentsPerDay: 8,
      bufferMinutesBetweenAppointments: 15,
    })

    const { data: inserted, error: insertError } = await supabase
      .from('staff_availability')
      .insert(defaultRow)
      .select()
      .single()
    if (insertError) throw insertError

    return mapStaffAvailability(inserted)
  },

  async updateStaffAvailability(
    staffId: string,
    availability: Partial<Omit<StaffAvailability, 'id' | 'staffId' | 'updatedAt'>>
  ): Promise<StaffAvailability> {
    // Check if a row exists
    const { data: existing, error: fetchError } = await supabase
      .from('staff_availability')
      .select('id')
      .eq('staff_id', staffId)
      .maybeSingle()
    if (fetchError) throw fetchError

    if (!existing) {
      // Create new availability if it doesn't exist
      const row = toDbStaffAvailability({
        staffId,
        weeklySchedule: availability.weeklySchedule ?? createDefaultWeeklySchedule(),
        maxAppointmentsPerDay: availability.maxAppointmentsPerDay ?? 8,
        bufferMinutesBetweenAppointments: availability.bufferMinutesBetweenAppointments ?? 15,
      })
      const { data: inserted, error: insertError } = await supabase
        .from('staff_availability')
        .insert(row)
        .select()
        .single()
      if (insertError) throw insertError
      return mapStaffAvailability(inserted)
    }

    const row = toDbStaffAvailability(availability)
    const { data: updated, error: updateError } = await supabase
      .from('staff_availability')
      .update(row)
      .eq('staff_id', staffId)
      .select()
      .single()
    if (updateError) throw updateError
    return mapStaffAvailability(updated)
  },

  // =============================================
  // Time off requests
  // =============================================

  async getTimeOffRequests(staffId?: string): Promise<TimeOffRequest[]> {
    let query = supabase.from('time_off_requests').select('*')
    if (staffId) {
      query = query.eq('staff_id', staffId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapTimeOffRequest)
  },

  async getTimeOffRequestById(id: string): Promise<TimeOffRequest | null> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapTimeOffRequest(data)
  },

  async createTimeOffRequest(
    staffId: string,
    request: Omit<TimeOffRequest, 'id' | 'staffId' | 'status' | 'createdAt'>
  ): Promise<TimeOffRequest> {
    const row = toDbTimeOffRequest({
      staffId,
      ...request,
      status: 'pending',
    })
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    return mapTimeOffRequest(data)
  },

  async updateTimeOffRequest(
    id: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<TimeOffRequest> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapTimeOffRequest(data)
  },

  async deleteTimeOffRequest(id: string): Promise<void> {
    const { error } = await supabase.from('time_off_requests').delete().eq('id', id)
    if (error) throw error
  },

  // =============================================
  // Availability check
  // =============================================

  async isStaffAvailable(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
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

  // =============================================
  // Get all staff with their availability
  // =============================================

  async getAllWithAvailability(organizationId?: string): Promise<Array<{
    groomer: Groomer
    availability: StaffAvailability | null
    timeOffRequests: TimeOffRequest[]
  }>> {
    // getAll() already batch-hydrates availability + timeOff, so reuse that data
    const groomers = await this.getAll(organizationId)

    return groomers.map(groomer => ({
      groomer,
      availability: groomer.availability ?? null,
      timeOffRequests: groomer.timeOff ?? [],
    }))
  },
}
