import type { AppointmentStatus } from '../types'

export const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(`Cannot change status from "${from}" to "${to}"`)
    this.name = 'InvalidStatusTransitionError'
  }
}

export function validateStatusTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): void {
  const validNextStates = VALID_TRANSITIONS[currentStatus]
  if (!validNextStates.includes(newStatus)) {
    throw new InvalidStatusTransitionError(currentStatus, newStatus)
  }
}

export function canTransitionTo(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus)
}
