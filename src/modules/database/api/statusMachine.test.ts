import { describe, it, expect } from 'vitest'
import {
  VALID_TRANSITIONS,
  InvalidStatusTransitionError,
  validateStatusTransition,
  canTransitionTo,
} from './statusMachine'
import type { AppointmentStatus } from '../types'

// ---------------------------------------------------------------------------
// VALID_TRANSITIONS data structure
// ---------------------------------------------------------------------------

describe('VALID_TRANSITIONS', () => {
  it('should define transitions for every appointment status', () => {
    const allStatuses: AppointmentStatus[] = [
      'requested',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
    ]
    for (const status of allStatuses) {
      expect(VALID_TRANSITIONS).toHaveProperty(status)
      expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true)
    }
  })

  it('should have no valid transitions from terminal states', () => {
    expect(VALID_TRANSITIONS.completed).toEqual([])
    expect(VALID_TRANSITIONS.cancelled).toEqual([])
    expect(VALID_TRANSITIONS.no_show).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// validateStatusTransition — valid transitions (happy path)
// ---------------------------------------------------------------------------

describe('validateStatusTransition — valid transitions', () => {
  it('should allow requested -> confirmed', () => {
    expect(() => validateStatusTransition('requested', 'confirmed')).not.toThrow()
  })

  it('should allow requested -> cancelled', () => {
    expect(() => validateStatusTransition('requested', 'cancelled')).not.toThrow()
  })

  it('should allow confirmed -> checked_in', () => {
    expect(() => validateStatusTransition('confirmed', 'checked_in')).not.toThrow()
  })

  it('should allow confirmed -> cancelled', () => {
    expect(() => validateStatusTransition('confirmed', 'cancelled')).not.toThrow()
  })

  it('should allow confirmed -> no_show', () => {
    expect(() => validateStatusTransition('confirmed', 'no_show')).not.toThrow()
  })

  it('should allow checked_in -> in_progress', () => {
    expect(() => validateStatusTransition('checked_in', 'in_progress')).not.toThrow()
  })

  it('should allow checked_in -> cancelled', () => {
    expect(() => validateStatusTransition('checked_in', 'cancelled')).not.toThrow()
  })

  it('should allow in_progress -> completed', () => {
    expect(() => validateStatusTransition('in_progress', 'completed')).not.toThrow()
  })

  it('should allow in_progress -> cancelled', () => {
    expect(() => validateStatusTransition('in_progress', 'cancelled')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// validateStatusTransition — invalid transitions
// ---------------------------------------------------------------------------

describe('validateStatusTransition — invalid transitions', () => {
  it('should reject completed -> any status', () => {
    const targets: AppointmentStatus[] = [
      'requested', 'confirmed', 'checked_in', 'in_progress', 'cancelled', 'no_show',
    ]
    for (const target of targets) {
      expect(() => validateStatusTransition('completed', target)).toThrow(
        InvalidStatusTransitionError
      )
    }
  })

  it('should reject cancelled -> any status', () => {
    const targets: AppointmentStatus[] = [
      'requested', 'confirmed', 'checked_in', 'in_progress', 'completed', 'no_show',
    ]
    for (const target of targets) {
      expect(() => validateStatusTransition('cancelled', target)).toThrow(
        InvalidStatusTransitionError
      )
    }
  })

  it('should reject no_show -> any status', () => {
    const targets: AppointmentStatus[] = [
      'requested', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled',
    ]
    for (const target of targets) {
      expect(() => validateStatusTransition('no_show', target)).toThrow(
        InvalidStatusTransitionError
      )
    }
  })

  it('should reject skipping steps (requested -> in_progress)', () => {
    expect(() => validateStatusTransition('requested', 'in_progress')).toThrow(
      InvalidStatusTransitionError
    )
  })

  it('should reject backward transitions (in_progress -> confirmed)', () => {
    expect(() => validateStatusTransition('in_progress', 'confirmed')).toThrow(
      InvalidStatusTransitionError
    )
  })

  it('should reject same-status transitions (confirmed -> confirmed)', () => {
    expect(() => validateStatusTransition('confirmed', 'confirmed')).toThrow(
      InvalidStatusTransitionError
    )
  })

  it('should include from/to statuses in the error message', () => {
    expect(() => validateStatusTransition('completed', 'requested')).toThrow(
      'Cannot change status from "completed" to "requested"'
    )
  })
})

// ---------------------------------------------------------------------------
// canTransitionTo
// ---------------------------------------------------------------------------

describe('canTransitionTo', () => {
  it('should return true for valid transitions', () => {
    expect(canTransitionTo('requested', 'confirmed')).toBe(true)
    expect(canTransitionTo('confirmed', 'checked_in')).toBe(true)
    expect(canTransitionTo('checked_in', 'in_progress')).toBe(true)
    expect(canTransitionTo('in_progress', 'completed')).toBe(true)
  })

  it('should return true for cancellation from any active status', () => {
    expect(canTransitionTo('requested', 'cancelled')).toBe(true)
    expect(canTransitionTo('confirmed', 'cancelled')).toBe(true)
    expect(canTransitionTo('checked_in', 'cancelled')).toBe(true)
    expect(canTransitionTo('in_progress', 'cancelled')).toBe(true)
  })

  it('should return false for transitions from terminal states', () => {
    expect(canTransitionTo('completed', 'requested')).toBe(false)
    expect(canTransitionTo('cancelled', 'confirmed')).toBe(false)
    expect(canTransitionTo('no_show', 'checked_in')).toBe(false)
  })

  it('should return false for skipped transitions', () => {
    expect(canTransitionTo('requested', 'in_progress')).toBe(false)
    expect(canTransitionTo('requested', 'completed')).toBe(false)
  })

  it('should return false for same-status transitions', () => {
    expect(canTransitionTo('requested', 'requested')).toBe(false)
    expect(canTransitionTo('completed', 'completed')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// InvalidStatusTransitionError
// ---------------------------------------------------------------------------

describe('InvalidStatusTransitionError', () => {
  it('should have the correct name property', () => {
    const error = new InvalidStatusTransitionError('requested', 'completed')
    expect(error.name).toBe('InvalidStatusTransitionError')
  })

  it('should be an instance of Error', () => {
    const error = new InvalidStatusTransitionError('requested', 'completed')
    expect(error).toBeInstanceOf(Error)
  })

  it('should format the message with from and to statuses', () => {
    const error = new InvalidStatusTransitionError('confirmed', 'requested')
    expect(error.message).toBe('Cannot change status from "confirmed" to "requested"')
  })
})
