// ============================================
// Subscription & Billing Types
// ============================================
export type SubscriptionPlanTier = 'solo' | 'studio'
export type SubscriptionBillingInterval = 'monthly' | 'yearly'
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export interface Subscription {
  id: string
  organizationId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  planTier: SubscriptionPlanTier
  billingInterval: SubscriptionBillingInterval
  status: SubscriptionStatus
  trialStart: string | null
  trialEnd: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BillingEvent {
  id: string
  stripeEventId: string
  eventType: string
  organizationId: string | null
  payload: Record<string, unknown>
  processedAt: string
}

export type GatedFeature =
  | 'multipleStaff'
  | 'rolePermissions'
  | 'serviceModifiers'
  | 'advancedReports'
  | 'staffScheduling'
  | 'performanceTracking'
  | 'prioritySupport'

// ============================================
// Vaccination Reminder Types
// ============================================
export type NotificationChannel = 'in_app' | 'email'
export type VaccinationStatus = 'valid' | 'expiring_30' | 'expiring_7' | 'expired'

export interface VaccinationReminderSettings {
  id: string
  organizationId: string
  enabled: boolean
  reminderDays: number[] // [30, 7]
  channels: { inApp: boolean; email: boolean }
  blockBookingOnExpired: boolean
  updatedAt: string
}

export interface VaccinationReminder {
  id: string
  petId: string
  clientId: string
  vaccinationId: string
  vaccinationName: string
  expirationDate: string
  reminderType: '30_day' | '7_day' | 'expired'
  status: 'pending' | 'sent' | 'dismissed'
  channels: NotificationChannel[]
  sentAt?: string
  createdAt: string
}

export interface InAppNotification {
  id: string
  organizationId: string
  type: 'vaccination_expiring' | 'vaccination_expired' | 'appointment_reminder' | 'general'
  title: string
  message: string
  petId?: string
  clientId?: string
  read: boolean
  createdAt: string
}

// ============================================
// Payment Method Types
// ============================================
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'

export interface PaymentMethod {
  id: string
  clientId: string
  type: 'card'
  card: {
    brand: CardBrand
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
  createdAt: string
}

// ============================================
// Staff Management Types
// ============================================
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface DaySchedule {
  dayOfWeek: DayOfWeek
  isWorkingDay: boolean
  startTime: string // "09:00"
  endTime: string   // "17:00"
  breakStart?: string
  breakEnd?: string
}

export interface TimeOffRequest {
  id: string
  staffId: string
  startDate: string
  endDate: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface StaffAvailability {
  id: string
  staffId: string
  weeklySchedule: DaySchedule[]
  maxAppointmentsPerDay: number
  bufferMinutesBetweenAppointments: number
  updatedAt: string
}

export interface RolePermissions {
  canManageStaff: boolean
  canManageClients: boolean
  canManageServices: boolean
  canManagePolicies: boolean
  canViewReports: boolean
  canEditCalendar: boolean
  canViewAllAppointments: boolean
  canManageOwnAppointments: boolean
  canBookAppointments: boolean
  canManageSettings: boolean
  canDeleteRecords: boolean
}

export type StaffRole = 'owner' | 'admin' | 'groomer' | 'receptionist'

export const ROLE_PERMISSIONS: Record<StaffRole, RolePermissions> = {
  owner: {
    canManageStaff: true,
    canManageClients: true,
    canManageServices: true,
    canManagePolicies: true,
    canViewReports: true,
    canEditCalendar: true,
    canViewAllAppointments: true,
    canManageOwnAppointments: true,
    canBookAppointments: true,
    canManageSettings: true,
    canDeleteRecords: true,
  },
  admin: {
    canManageStaff: true,
    canManageClients: true,
    canManageServices: true,
    canManagePolicies: true,
    canViewReports: true,
    canEditCalendar: true,
    canViewAllAppointments: true,
    canManageOwnAppointments: true,
    canBookAppointments: true,
    canManageSettings: true,
    canDeleteRecords: true,
  },
  groomer: {
    canManageStaff: false,
    canManageClients: true,
    canManageServices: false,
    canManagePolicies: false,
    canViewReports: false,
    canEditCalendar: false,
    canViewAllAppointments: false,
    canManageOwnAppointments: true,
    canBookAppointments: true,
    canManageSettings: false,
    canDeleteRecords: false,
  },
  receptionist: {
    canManageStaff: false,
    canManageClients: true,
    canManageServices: false,
    canManagePolicies: false,
    canViewReports: false,
    canEditCalendar: true,
    canViewAllAppointments: true,
    canManageOwnAppointments: false,
    canBookAppointments: true,
    canManageSettings: false,
    canDeleteRecords: false,
  },
}

export const PERMISSION_LABELS: Record<keyof RolePermissions, { label: string; description: string; category: string }> = {
  canManageStaff:           { label: 'Manage Staff',            description: 'Add, edit, and deactivate staff members',  category: 'Staff' },
  canManageClients:         { label: 'Manage Clients',          description: 'View and edit client profiles',            category: 'Clients' },
  canManageServices:        { label: 'Manage Services',         description: 'Create and edit service catalog',          category: 'Services' },
  canManagePolicies:        { label: 'Manage Policies',         description: 'Edit booking and cancellation policies',   category: 'Policies' },
  canViewReports:           { label: 'View Reports',            description: 'Access analytics and export data',         category: 'Reports' },
  canEditCalendar:          { label: 'Edit Calendar',           description: 'Modify any appointment on the calendar',   category: 'Calendar' },
  canViewAllAppointments:   { label: 'View All Appointments',   description: "See every staff member's schedule",        category: 'Calendar' },
  canManageOwnAppointments: { label: 'Manage Own Appointments', description: 'Edit and update assigned appointments',    category: 'Calendar' },
  canBookAppointments:      { label: 'Book Appointments',       description: 'Create new appointments',                  category: 'Booking' },
  canManageSettings:        { label: 'Manage Settings',         description: 'Edit organization settings and theme',     category: 'Settings' },
  canDeleteRecords:         { label: 'Delete Records',          description: 'Soft-delete clients, pets, and services',  category: 'Data' },
}

// ============================================
// Organization types
// ============================================
export interface Organization {
  id: string
  name: string
  slug: string
  address: string
  phone: string
  email: string
  timezone: string
  stripeCustomerId?: string
  emailSettings?: { replyToEmail?: string; senderDisplayName?: string }
  createdAt: string
  updatedAt: string
}

// Client types
export interface ClientNotificationPreferences {
  vaccinationReminders: {
    enabled: boolean
    channels: NotificationChannel[]
  }
  appointmentReminders: {
    enabled: boolean
    channels: NotificationChannel[]
  }
}

export interface Client {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  notes?: string
  imageUrl?: string
  preferredContactMethod: 'email' | 'phone'
  isNewClient: boolean
  notificationPreferences?: ClientNotificationPreferences
  paymentMethods?: PaymentMethod[]
  createdAt: string
  updatedAt: string
}

// Pet types
export type PetSpecies = 'dog' | 'cat' | 'other'
export type BehaviorLevel = 1 | 2 | 3 | 4 | 5 // 1 = calm, 5 = difficult
export type CoatType = 'short' | 'medium' | 'long' | 'curly' | 'double' | 'wire'
export type WeightRange = 'small' | 'medium' | 'large' | 'xlarge'

export interface VaccinationRecord {
  id: string
  name: string
  dateAdministered: string
  expirationDate: string
  documentUrl?: string
}

export interface Pet {
  id: string
  clientId: string
  organizationId: string
  name: string
  species: PetSpecies
  breed: string
  weight: number
  weightRange: WeightRange
  coatType: CoatType
  birthDate?: string
  behaviorLevel: BehaviorLevel
  groomingNotes?: string
  medicalNotes?: string
  imageUrl?: string
  vaccinations: VaccinationRecord[]
  lastGroomingDate?: string
  preferredGroomerId?: string
  createdAt: string
  updatedAt: string
}

// Service types
export interface ServiceModifier {
  id: string
  serviceId: string
  name: string
  type: 'weight' | 'coat' | 'breed' | 'addon'
  condition?: {
    weightRange?: WeightRange[]
    coatType?: CoatType[]
    breed?: string[]
  }
  durationMinutes: number
  priceAdjustment: number
  isPercentage: boolean
}

export interface Service {
  id: string
  organizationId: string
  name: string
  description: string
  baseDurationMinutes: number
  basePrice: number
  category: 'bath' | 'haircut' | 'nail' | 'specialty' | 'package'
  isActive: boolean
  modifiers: ServiceModifier[]
  createdAt: string
  updatedAt: string
}

// Appointment types
export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface AppointmentPet {
  petId: string
  pet?: Pet
  services: {
    serviceId: string
    service?: Service
    appliedModifiers: string[]
    finalDuration: number
    finalPrice: number
  }[]
}

export interface Appointment {
  id: string
  organizationId: string
  clientId: string
  client?: Client
  pets: AppointmentPet[]
  groomerId?: string
  groomer?: import('@/types').User
  startTime: string
  endTime: string
  status: AppointmentStatus
  statusNotes?: string
  internalNotes?: string
  clientNotes?: string
  depositAmount?: number
  depositPaid: boolean
  totalAmount: number
  tipAmount?: number
  paymentStatus?: PaymentStatus
  paidAt?: string
  transactionId?: string
  createdAt: string
  updatedAt: string
}

// Policy types
export interface BookingPolicies {
  id: string
  organizationId: string
  newClientMode: 'auto_confirm' | 'request_only' | 'blocked'
  existingClientMode: 'auto_confirm' | 'request_only'
  depositRequired: boolean
  depositPercentage: number
  depositMinimum: number
  noShowFeePercentage: number
  cancellationWindowHours: number
  lateCancellationFeePercentage: number
  maxPetsPerAppointment: number
  minAdvanceBookingHours: number
  maxAdvanceBookingDays: number
  policyText: string
  updatedAt: string
}

// Reminder types
export interface ReminderSchedule {
  id: string
  organizationId: string
  appointmentReminders: {
    enabled48h: boolean
    enabled24h: boolean
    enabled2h: boolean
    template48h: string
    template24h: string
    template2h: string
  }
  dueForGrooming: {
    enabled: boolean
    intervalDays: number
    template: string
  }
  updatedAt: string
}

// Payment types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TipOption = 'none' | '5' | '10' | '15' | 'custom'

export interface PaymentInfo {
  tipAmount: number
  tipOption: TipOption
  paymentStatus: PaymentStatus
  paymentMethod?: 'card' | 'cash'
  paidAt?: string
  transactionId?: string
}

// Booking flow types
export interface BookingState {
  organizationId: string
  clientId?: string
  isNewClient: boolean
  clientInfo?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
  }
  selectedPets: {
    petId?: string
    isNewPet: boolean
    petInfo?: Partial<Pet>
    services: {
      serviceId: string
      modifierIds: string[]
    }[]
  }[]
  selectedTimeSlot?: {
    date: string
    startTime: string
    endTime: string
  }
  selectedGroomerId?: string
  notes?: string
  payment?: PaymentInfo
  selectedPaymentMethodId?: string
  saveNewCardForFuture?: boolean
}

// Time slot types
export interface TimeSlot {
  date: string
  startTime: string
  endTime: string
  available: boolean
  groomerId?: string
}

// Groomer/Staff types
export interface Groomer {
  id: string
  organizationId: string
  userId?: string // Links to User for auth
  firstName: string
  lastName: string
  email: string
  phone: string
  specialties: string[]
  imageUrl?: string
  isActive: boolean
  role: StaffRole
  availability?: StaffAvailability
  timeOff?: TimeOffRequest[]
  createdAt: string
  updatedAt: string
}

// Feature flags
export interface FeatureFlags {
  multiStaffScheduling: boolean
  onlinePayments: boolean
  emailReminders: boolean
  clientPortal: boolean
  petPhotos: boolean
  inventoryManagement: boolean
  devBypassSubscription: boolean
}

// Deleted item history types
export type DeletedEntityType = 'client' | 'pet' | 'groomer' | 'service'

export interface DeletedItem<T = unknown> {
  id: string
  entityType: DeletedEntityType
  entityId: string
  entityName: string
  data: T
  deletedAt: string
}
