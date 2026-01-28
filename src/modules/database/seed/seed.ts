import type {
  Organization,
  Client,
  Pet,
  Service,
  ServiceModifier,
  Appointment,
  BookingPolicies,
  ReminderSchedule,
  VaccinationReminderSettings,
  StaffAvailability,
  Groomer,
  DaySchedule,
} from '../types'
import type { User } from '@/types'
import { addDays, addHours, format, setHours, setMinutes, startOfDay } from 'date-fns'

const ORG_ID = 'org-1'
const today = startOfDay(new Date())

export const seedOrganization: Organization = {
  id: ORG_ID,
  name: 'Paws & Claws Grooming',
  slug: 'paws-claws',
  address: '123 Pet Street, Dogtown, CA 90210',
  phone: '(555) 123-4567',
  email: 'hello@pawsclaws.com',
  timezone: 'America/Los_Angeles',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const seedUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@pawsclaws.com',
    name: 'Sarah Johnson',
    role: 'admin',
    organizationId: ORG_ID,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'mike@pawsclaws.com',
    name: 'Mike Chen',
    role: 'groomer',
    organizationId: ORG_ID,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'lisa@pawsclaws.com',
    name: 'Lisa Martinez',
    role: 'groomer',
    organizationId: ORG_ID,
    createdAt: '2024-02-01T00:00:00Z',
  },
]

export const seedClients: Client[] = [
  {
    id: 'client-1',
    organizationId: ORG_ID,
    firstName: 'Emily',
    lastName: 'Wilson',
    email: 'emily.wilson@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue, Dogtown, CA 90210',
    notes: 'Prefers morning appointments. Always tips well.',
    preferredContactMethod: 'text',
    isNewClient: false,
    notificationPreferences: {
      vaccinationReminders: { enabled: true, channels: ['email', 'sms'] },
      appointmentReminders: { enabled: true, channels: ['sms'] },
    },
    paymentMethods: [
      {
        id: 'pm-1',
        clientId: 'client-1',
        type: 'card',
        card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2026 },
        isDefault: true,
        createdAt: '2024-02-01T00:00:00Z',
      },
      {
        id: 'pm-2',
        clientId: 'client-1',
        type: 'card',
        card: { brand: 'mastercard', last4: '5555', expMonth: 6, expYear: 2025 },
        isDefault: false,
        createdAt: '2024-05-15T00:00:00Z',
      },
    ],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
  },
  {
    id: 'client-2',
    organizationId: ORG_ID,
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.t@email.com',
    phone: '(555) 345-6789',
    address: '789 Maple Drive, Dogtown, CA 90210',
    notes: 'Has two dogs that need to be groomed together.',
    preferredContactMethod: 'email',
    isNewClient: false,
    notificationPreferences: {
      vaccinationReminders: { enabled: true, channels: ['email'] },
      appointmentReminders: { enabled: true, channels: ['email'] },
    },
    paymentMethods: [
      {
        id: 'pm-3',
        clientId: 'client-2',
        type: 'card',
        card: { brand: 'amex', last4: '0005', expMonth: 3, expYear: 2027 },
        isDefault: true,
        createdAt: '2024-03-10T00:00:00Z',
      },
    ],
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-07-20T00:00:00Z',
  },
  {
    id: 'client-3',
    organizationId: ORG_ID,
    firstName: 'Jennifer',
    lastName: 'Garcia',
    email: 'jen.garcia@email.com',
    phone: '(555) 456-7890',
    notes: 'New client - referred by Emily Wilson',
    preferredContactMethod: 'phone',
    isNewClient: true,
    notificationPreferences: {
      vaccinationReminders: { enabled: true, channels: ['in_app'] },
      appointmentReminders: { enabled: true, channels: ['in_app', 'email'] },
    },
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'client-4',
    organizationId: ORG_ID,
    firstName: 'Robert',
    lastName: 'Kim',
    email: 'robert.kim@email.com',
    phone: '(555) 567-8901',
    address: '321 Pine Street, Dogtown, CA 90210',
    preferredContactMethod: 'text',
    isNewClient: false,
    notificationPreferences: {
      vaccinationReminders: { enabled: true, channels: ['sms', 'email'] },
      appointmentReminders: { enabled: true, channels: ['sms'] },
    },
    paymentMethods: [
      {
        id: 'pm-4',
        clientId: 'client-4',
        type: 'card',
        card: { brand: 'discover', last4: '1117', expMonth: 9, expYear: 2026 },
        isDefault: true,
        createdAt: '2024-04-05T00:00:00Z',
      },
    ],
    createdAt: '2024-04-05T00:00:00Z',
    updatedAt: '2024-08-10T00:00:00Z',
  },
]

export const seedPets: Pet[] = [
  {
    id: 'pet-1',
    clientId: 'client-1',
    organizationId: ORG_ID,
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    weight: 70,
    weightRange: 'large',
    coatType: 'long',
    birthDate: '2020-03-15',
    behaviorLevel: 2,
    groomingNotes: 'Loves water. Extra brushing needed during shedding season.',
    vaccinations: [
      {
        id: 'vax-1',
        name: 'Rabies',
        dateAdministered: format(addDays(today, -340), 'yyyy-MM-dd'),
        expirationDate: format(addDays(today, 25), 'yyyy-MM-dd'), // Expiring in ~25 days (30-day warning)
      },
      {
        id: 'vax-2',
        name: 'DHPP',
        dateAdministered: format(addDays(today, -360), 'yyyy-MM-dd'),
        expirationDate: format(addDays(today, 5), 'yyyy-MM-dd'), // Expiring in 5 days (7-day warning)
      },
    ],
    lastGroomingDate: format(addDays(today, -30), 'yyyy-MM-dd'),
    preferredGroomerId: 'user-2',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-08-15T00:00:00Z',
  },
  {
    id: 'pet-2',
    clientId: 'client-2',
    organizationId: ORG_ID,
    name: 'Max',
    species: 'dog',
    breed: 'German Shepherd',
    weight: 85,
    weightRange: 'xlarge',
    coatType: 'double',
    birthDate: '2019-07-22',
    behaviorLevel: 3,
    groomingNotes: 'Can be nervous with nail trims. Use treats.',
    medicalNotes: 'Slight hip dysplasia - be gentle when positioning.',
    vaccinations: [
      {
        id: 'vax-3',
        name: 'Rabies',
        dateAdministered: format(addDays(today, -400), 'yyyy-MM-dd'),
        expirationDate: format(addDays(today, -10), 'yyyy-MM-dd'), // Expired 10 days ago
      },
    ],
    lastGroomingDate: format(addDays(today, -45), 'yyyy-MM-dd'),
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-07-20T00:00:00Z',
  },
  {
    id: 'pet-3',
    clientId: 'client-2',
    organizationId: ORG_ID,
    name: 'Luna',
    species: 'dog',
    breed: 'Shih Tzu',
    weight: 12,
    weightRange: 'small',
    coatType: 'long',
    birthDate: '2021-11-05',
    behaviorLevel: 1,
    groomingNotes: 'Very sweet. Owner prefers teddy bear cut.',
    vaccinations: [
      {
        id: 'vax-4',
        name: 'Rabies',
        dateAdministered: format(addDays(today, -300), 'yyyy-MM-dd'),
        expirationDate: format(addDays(today, 65), 'yyyy-MM-dd'), // Valid - expires in 65 days
      },
      {
        id: 'vax-5',
        name: 'Bordetella',
        dateAdministered: format(addDays(today, -180), 'yyyy-MM-dd'),
        expirationDate: format(addDays(today, 185), 'yyyy-MM-dd'), // Valid - expires in 185 days
      },
    ],
    lastGroomingDate: format(addDays(today, -21), 'yyyy-MM-dd'),
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'pet-4',
    clientId: 'client-3',
    organizationId: ORG_ID,
    name: 'Whiskers',
    species: 'cat',
    breed: 'Persian',
    weight: 10,
    weightRange: 'small',
    coatType: 'long',
    birthDate: '2022-05-10',
    behaviorLevel: 4,
    groomingNotes: 'First time at our salon. Owner says can be skittish.',
    vaccinations: [], // No vaccinations - new client
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'pet-5',
    clientId: 'client-4',
    organizationId: ORG_ID,
    name: 'Charlie',
    species: 'dog',
    breed: 'Poodle',
    weight: 55,
    weightRange: 'large',
    coatType: 'curly',
    birthDate: '2020-09-18',
    behaviorLevel: 1,
    groomingNotes: 'Standard poodle cut. Very well-behaved.',
    vaccinations: [
      {
        id: 'vax-6',
        name: 'Rabies',
        dateAdministered: format(addDays(today, -200), 'yyyy-MM-dd'),
        expirationDate: format(addDays(today, 165), 'yyyy-MM-dd'), // Valid - expires in 165 days
      },
    ],
    lastGroomingDate: format(addDays(today, -14), 'yyyy-MM-dd'),
    preferredGroomerId: 'user-3',
    createdAt: '2024-04-05T00:00:00Z',
    updatedAt: '2024-08-10T00:00:00Z',
  },
]

const createModifier = (
  id: string,
  serviceId: string,
  name: string,
  type: ServiceModifier['type'],
  durationMinutes: number,
  priceAdjustment: number,
  isPercentage: boolean,
  condition?: ServiceModifier['condition']
): ServiceModifier => ({
  id,
  serviceId,
  name,
  type,
  durationMinutes,
  priceAdjustment,
  isPercentage,
  condition,
})

export const seedServices: Service[] = [
  {
    id: 'service-1',
    organizationId: ORG_ID,
    name: 'Basic Bath',
    description: 'Includes shampoo, conditioning, blow dry, and ear cleaning.',
    baseDurationMinutes: 45,
    basePrice: 35,
    category: 'bath',
    isActive: true,
    modifiers: [
      createModifier('mod-1', 'service-1', 'Large Dog', 'weight', 15, 15, false, {
        weightRange: ['large'],
      }),
      createModifier('mod-2', 'service-1', 'X-Large Dog', 'weight', 30, 25, false, {
        weightRange: ['xlarge'],
      }),
      createModifier('mod-3', 'service-1', 'Long Coat', 'coat', 15, 10, false, {
        coatType: ['long', 'double'],
      }),
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-2',
    organizationId: ORG_ID,
    name: 'Full Groom',
    description: 'Bath plus full haircut, nail trim, and sanitary trim.',
    baseDurationMinutes: 90,
    basePrice: 65,
    category: 'haircut',
    isActive: true,
    modifiers: [
      createModifier('mod-4', 'service-2', 'Large Dog', 'weight', 30, 25, false, {
        weightRange: ['large'],
      }),
      createModifier('mod-5', 'service-2', 'X-Large Dog', 'weight', 45, 40, false, {
        weightRange: ['xlarge'],
      }),
      createModifier('mod-6', 'service-2', 'Curly Coat', 'coat', 30, 20, false, {
        coatType: ['curly'],
      }),
      createModifier('mod-7', 'service-2', 'Double Coat', 'coat', 20, 15, false, {
        coatType: ['double'],
      }),
      createModifier('mod-8', 'service-2', 'Dematting', 'addon', 30, 25, false),
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-3',
    organizationId: ORG_ID,
    name: 'Nail Trim',
    description: 'Nail trimming and filing.',
    baseDurationMinutes: 15,
    basePrice: 15,
    category: 'nail',
    isActive: true,
    modifiers: [
      createModifier('mod-9', 'service-3', 'Difficult Behavior', 'addon', 10, 10, false),
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-4',
    organizationId: ORG_ID,
    name: 'Puppy Package',
    description: 'Gentle introduction to grooming for puppies under 6 months.',
    baseDurationMinutes: 30,
    basePrice: 25,
    category: 'package',
    isActive: true,
    modifiers: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-5',
    organizationId: ORG_ID,
    name: 'Teeth Brushing',
    description: 'Dental cleaning with pet-safe toothpaste.',
    baseDurationMinutes: 10,
    basePrice: 12,
    category: 'specialty',
    isActive: true,
    modifiers: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-6',
    organizationId: ORG_ID,
    name: 'De-shedding Treatment',
    description: 'Special treatment to reduce shedding by up to 80%.',
    baseDurationMinutes: 60,
    basePrice: 45,
    category: 'specialty',
    isActive: true,
    modifiers: [
      createModifier('mod-10', 'service-6', 'Large Dog', 'weight', 20, 20, false, {
        weightRange: ['large', 'xlarge'],
      }),
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Generate appointments for the calendar
function createAppointmentTime(dayOffset: number, hour: number, minute: number = 0): Date {
  return setMinutes(setHours(addDays(today, dayOffset), hour), minute)
}

export const seedAppointments: Appointment[] = [
  {
    id: 'apt-1',
    organizationId: ORG_ID,
    clientId: 'client-1',
    pets: [
      {
        petId: 'pet-1',
        services: [
          {
            serviceId: 'service-2',
            appliedModifiers: ['mod-4', 'mod-3'],
            finalDuration: 135,
            finalPrice: 100,
          },
        ],
      },
    ],
    groomerId: 'user-2',
    startTime: createAppointmentTime(0, 9).toISOString(),
    endTime: addHours(createAppointmentTime(0, 9), 2.25).toISOString(),
    status: 'confirmed',
    internalNotes: 'Regular client. Buddy loves his groomer Mike.',
    depositAmount: 25,
    depositPaid: true,
    totalAmount: 100,
    createdAt: '2024-08-10T00:00:00Z',
    updatedAt: '2024-08-10T00:00:00Z',
  },
  {
    id: 'apt-2',
    organizationId: ORG_ID,
    clientId: 'client-2',
    pets: [
      {
        petId: 'pet-2',
        services: [
          {
            serviceId: 'service-1',
            appliedModifiers: ['mod-2', 'mod-3'],
            finalDuration: 90,
            finalPrice: 70,
          },
        ],
      },
      {
        petId: 'pet-3',
        services: [
          {
            serviceId: 'service-2',
            appliedModifiers: [],
            finalDuration: 90,
            finalPrice: 65,
          },
        ],
      },
    ],
    groomerId: 'user-3',
    startTime: createAppointmentTime(0, 11).toISOString(),
    endTime: addHours(createAppointmentTime(0, 11), 3).toISOString(),
    status: 'checked_in',
    clientNotes: 'Please groom Max and Luna together.',
    depositAmount: 35,
    depositPaid: true,
    totalAmount: 135,
    createdAt: '2024-08-12T00:00:00Z',
    updatedAt: '2024-08-12T00:00:00Z',
  },
  {
    id: 'apt-3',
    organizationId: ORG_ID,
    clientId: 'client-4',
    pets: [
      {
        petId: 'pet-5',
        services: [
          {
            serviceId: 'service-2',
            appliedModifiers: ['mod-4', 'mod-6'],
            finalDuration: 150,
            finalPrice: 110,
          },
          {
            serviceId: 'service-5',
            appliedModifiers: [],
            finalDuration: 10,
            finalPrice: 12,
          },
        ],
      },
    ],
    groomerId: 'user-3',
    startTime: createAppointmentTime(0, 15).toISOString(),
    endTime: addHours(createAppointmentTime(0, 15), 2.5).toISOString(),
    status: 'confirmed',
    internalNotes: 'Charlie is a regular. Standard poodle cut.',
    depositAmount: 30,
    depositPaid: true,
    totalAmount: 122,
    createdAt: '2024-08-14T00:00:00Z',
    updatedAt: '2024-08-14T00:00:00Z',
  },
  {
    id: 'apt-4',
    organizationId: ORG_ID,
    clientId: 'client-3',
    pets: [
      {
        petId: 'pet-4',
        services: [
          {
            serviceId: 'service-1',
            appliedModifiers: ['mod-3'],
            finalDuration: 60,
            finalPrice: 45,
          },
        ],
      },
    ],
    groomerId: 'user-2',
    startTime: createAppointmentTime(1, 10).toISOString(),
    endTime: addHours(createAppointmentTime(1, 10), 1).toISOString(),
    status: 'requested',
    clientNotes: 'First visit. Cat may be nervous.',
    depositPaid: false,
    totalAmount: 45,
    createdAt: '2024-08-15T00:00:00Z',
    updatedAt: '2024-08-15T00:00:00Z',
  },
  {
    id: 'apt-5',
    organizationId: ORG_ID,
    clientId: 'client-1',
    pets: [
      {
        petId: 'pet-1',
        services: [
          {
            serviceId: 'service-3',
            appliedModifiers: [],
            finalDuration: 15,
            finalPrice: 15,
          },
        ],
      },
    ],
    groomerId: 'user-2',
    startTime: createAppointmentTime(2, 9).toISOString(),
    endTime: addHours(createAppointmentTime(2, 9), 0.25).toISOString(),
    status: 'confirmed',
    depositPaid: false,
    totalAmount: 15,
    createdAt: '2024-08-16T00:00:00Z',
    updatedAt: '2024-08-16T00:00:00Z',
  },
  {
    id: 'apt-6',
    organizationId: ORG_ID,
    clientId: 'client-4',
    pets: [
      {
        petId: 'pet-5',
        services: [
          {
            serviceId: 'service-6',
            appliedModifiers: ['mod-10'],
            finalDuration: 80,
            finalPrice: 65,
          },
        ],
      },
    ],
    groomerId: 'user-3',
    startTime: createAppointmentTime(3, 13).toISOString(),
    endTime: addHours(createAppointmentTime(3, 13), 1.5).toISOString(),
    status: 'confirmed',
    internalNotes: 'De-shedding treatment before summer.',
    depositAmount: 15,
    depositPaid: true,
    totalAmount: 65,
    createdAt: '2024-08-17T00:00:00Z',
    updatedAt: '2024-08-17T00:00:00Z',
  },
  // Past appointments for history
  {
    id: 'apt-7',
    organizationId: ORG_ID,
    clientId: 'client-1',
    pets: [
      {
        petId: 'pet-1',
        services: [
          {
            serviceId: 'service-2',
            appliedModifiers: ['mod-4', 'mod-3'],
            finalDuration: 135,
            finalPrice: 100,
          },
        ],
      },
    ],
    groomerId: 'user-2',
    startTime: createAppointmentTime(-7, 10).toISOString(),
    endTime: addHours(createAppointmentTime(-7, 10), 2.25).toISOString(),
    status: 'completed',
    depositAmount: 25,
    depositPaid: true,
    totalAmount: 100,
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-08T00:00:00Z',
  },
  {
    id: 'apt-8',
    organizationId: ORG_ID,
    clientId: 'client-2',
    pets: [
      {
        petId: 'pet-3',
        services: [
          {
            serviceId: 'service-2',
            appliedModifiers: [],
            finalDuration: 90,
            finalPrice: 65,
          },
        ],
      },
    ],
    groomerId: 'user-3',
    startTime: createAppointmentTime(-14, 14).toISOString(),
    endTime: addHours(createAppointmentTime(-14, 14), 1.5).toISOString(),
    status: 'completed',
    depositAmount: 15,
    depositPaid: true,
    totalAmount: 65,
    createdAt: '2024-07-25T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
]

export const seedPolicies: BookingPolicies = {
  id: 'policy-1',
  organizationId: ORG_ID,
  newClientMode: 'request_only',
  existingClientMode: 'auto_confirm',
  depositRequired: true,
  depositPercentage: 25,
  depositMinimum: 15,
  noShowFeePercentage: 50,
  cancellationWindowHours: 24,
  lateCancellationFeePercentage: 50,
  maxPetsPerAppointment: 3,
  minAdvanceBookingHours: 24,
  maxAdvanceBookingDays: 60,
  policyText:
    'A 25% deposit is required to confirm your appointment. Cancellations made less than 24 hours in advance are subject to a 50% cancellation fee. No-shows will be charged 50% of the appointment total.',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const seedReminders: ReminderSchedule = {
  id: 'reminder-1',
  organizationId: ORG_ID,
  appointmentReminders: {
    enabled48h: true,
    enabled24h: true,
    enabled2h: false,
    template48h:
      "Hi {{clientName}}! This is a reminder that {{petName}}'s grooming appointment is in 2 days on {{date}} at {{time}}. Reply CONFIRM to confirm or call us to reschedule.",
    template24h:
      "Reminder: {{petName}}'s grooming appointment is tomorrow at {{time}}. Please arrive 5 minutes early. See you soon!",
    template2h:
      "{{petName}}'s appointment starts in 2 hours at {{time}}. We're looking forward to seeing you!",
  },
  dueForGrooming: {
    enabled: true,
    intervalDays: 42,
    template:
      "Hi {{clientName}}! It's been a while since {{petName}}'s last groom. Ready to book their next appointment? Visit our booking page or give us a call!",
  },
  updatedAt: '2024-01-01T00:00:00Z',
}

// Vaccination reminder settings
export const seedVaccinationReminderSettings: VaccinationReminderSettings = {
  id: 'vax-settings-1',
  organizationId: ORG_ID,
  enabled: true,
  reminderDays: [30, 7],
  channels: { inApp: true, email: true, sms: false },
  blockBookingOnExpired: true,
  updatedAt: '2024-01-01T00:00:00Z',
}

// Helper to create a default weekly schedule
function createDefaultWeeklySchedule(
  workDays: number[] = [1, 2, 3, 4, 5], // Mon-Fri
  startTime: string = '09:00',
  endTime: string = '17:00',
  breakStart?: string,
  breakEnd?: string
): DaySchedule[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day as DaySchedule['dayOfWeek'],
    isWorkingDay: workDays.includes(day),
    startTime,
    endTime,
    breakStart,
    breakEnd,
  }))
}

// Staff availability data
export const seedStaffAvailability: StaffAvailability[] = [
  {
    id: 'avail-1',
    staffId: 'user-2', // Mike Chen
    weeklySchedule: createDefaultWeeklySchedule([1, 2, 3, 4, 5], '08:00', '16:00', '12:00', '12:30'),
    maxAppointmentsPerDay: 8,
    bufferMinutesBetweenAppointments: 15,
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'avail-2',
    staffId: 'user-3', // Lisa Martinez
    weeklySchedule: createDefaultWeeklySchedule([1, 2, 3, 4, 6], '10:00', '18:00', '13:00', '13:30'), // Tue-Sat
    maxAppointmentsPerDay: 6,
    bufferMinutesBetweenAppointments: 20,
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

// Groomers with role and availability
export const seedGroomers: Groomer[] = [
  {
    id: 'user-2',
    organizationId: ORG_ID,
    userId: 'user-2',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike@pawsclaws.com',
    phone: '(555) 222-3333',
    specialties: ['Large breeds', 'Hand stripping', 'Show cuts'],
    isActive: true,
    role: 'groomer',
    availability: seedStaffAvailability[0],
    timeOff: [
      {
        id: 'to-1',
        staffId: 'user-2',
        startDate: format(addDays(today, 14), 'yyyy-MM-dd'),
        endDate: format(addDays(today, 16), 'yyyy-MM-dd'),
        reason: 'Personal time',
        status: 'approved',
        createdAt: '2024-08-01T00:00:00Z',
      },
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'user-3',
    organizationId: ORG_ID,
    userId: 'user-3',
    firstName: 'Lisa',
    lastName: 'Martinez',
    email: 'lisa@pawsclaws.com',
    phone: '(555) 333-4444',
    specialties: ['Small breeds', 'Cats', 'Puppy first grooms'],
    isActive: true,
    role: 'groomer',
    availability: seedStaffAvailability[1],
    timeOff: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'user-1',
    organizationId: ORG_ID,
    userId: 'user-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'admin@pawsclaws.com',
    phone: '(555) 111-2222',
    specialties: ['Management', 'All breeds'],
    isActive: true,
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-01T00:00:00Z',
  },
]
