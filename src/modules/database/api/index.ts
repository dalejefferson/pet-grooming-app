export { orgApi } from './orgApi'
export { clientsApi } from './clientsApi'
export { petsApi } from './petsApi'
export { servicesApi } from './servicesApi'
export { calendarApi } from './calendarApi'
export { bookingApi } from './bookingApi'
export { policiesApi } from './policiesApi'
export { remindersApi } from './remindersApi'
export { groomersApi } from './groomersApi'
export { historyApi } from './historyApi'
export { paymentMethodsApi } from './paymentMethodsApi'
export { vaccinationRemindersApi } from './vaccinationRemindersApi'
export { staffApi } from './staffApi'
export { performanceApi } from './performanceApi'
export { billingApi } from './billingApi'
export { emailApi } from './emailApi'

// Re-export types from bookingApi
export type { BookingResult } from './bookingApi'

// Re-export types from vaccinationRemindersApi
export type {
  PetWithExpiringVaccinations,
  BookingEligibility,
} from './vaccinationRemindersApi'

// Re-export types from performanceApi
export type { DateRange, StaffPerformanceMetrics } from './performanceApi'

// Re-export status machine utilities
export {
  VALID_TRANSITIONS,
  validateStatusTransition,
  canTransitionTo,
  InvalidStatusTransitionError,
} from './statusMachine'

// Re-export validators
export {
  validateMaxPetsPerAppointment,
  validateAdvanceBooking,
  validateCancellationWindow,
  validateVaccinationStatus,
  validatePetOwnership,
  BookingValidationError,
} from './validators'
