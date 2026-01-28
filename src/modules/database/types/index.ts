// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  address: string
  phone: string
  email: string
  timezone: string
  createdAt: string
  updatedAt: string
}

// Client types
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
  preferredContactMethod: 'email' | 'phone' | 'text'
  isNewClient: boolean
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
}

// Time slot types
export interface TimeSlot {
  date: string
  startTime: string
  endTime: string
  available: boolean
  groomerId?: string
}

// Groomer types
export interface Groomer {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialties: string[]
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Feature flags
export interface FeatureFlags {
  multiStaffScheduling: boolean
  onlinePayments: boolean
  smsReminders: boolean
  emailReminders: boolean
  clientPortal: boolean
  petPhotos: boolean
  inventoryManagement: boolean
}
