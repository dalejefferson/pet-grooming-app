/**
 * Bidirectional mappers between Supabase snake_case rows and app camelCase types.
 * These keep the existing app types unchanged while adapting to the DB schema.
 */

import type {
  Organization,
  Client,
  ClientNotificationPreferences,
  PaymentMethod,
  CardBrand,
  Pet,
  PetSpecies,
  WeightRange,
  CoatType,
  BehaviorLevel,
  VaccinationRecord,
  Service,
  ServiceModifier,
  Appointment,
  AppointmentStatus,
  AppointmentPet,
  PaymentStatus,
  Groomer,
  StaffRole,
  StaffAvailability,
  DaySchedule,
  TimeOffRequest,
  BookingPolicies,
  ReminderSchedule,
  VaccinationReminderSettings,
  VaccinationReminder,
  InAppNotification,
  DeletedItem,
  DeletedEntityType,
} from './index'

// ============================================
// Generic helper types for Supabase rows
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>

// ============================================
// Organization
// ============================================

export function mapOrganization(row: DbRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    timezone: row.timezone ?? 'America/Los_Angeles',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbOrganization(org: Partial<Organization>): DbRow {
  const row: DbRow = {}
  if (org.name !== undefined) row.name = org.name
  if (org.slug !== undefined) row.slug = org.slug
  if (org.address !== undefined) row.address = org.address
  if (org.phone !== undefined) row.phone = org.phone
  if (org.email !== undefined) row.email = org.email
  if (org.timezone !== undefined) row.timezone = org.timezone
  return row
}

// ============================================
// Client
// ============================================

export function mapClient(row: DbRow, paymentMethods?: PaymentMethod[]): Client {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    imageUrl: row.image_url ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? 'email',
    isNewClient: row.is_new_client ?? true,
    notificationPreferences: row.notification_preferences as ClientNotificationPreferences | undefined,
    paymentMethods: paymentMethods ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbClient(client: Partial<Client>): DbRow {
  const row: DbRow = {}
  if (client.organizationId !== undefined) row.organization_id = client.organizationId
  if (client.firstName !== undefined) row.first_name = client.firstName
  if (client.lastName !== undefined) row.last_name = client.lastName
  if (client.email !== undefined) row.email = client.email
  if (client.phone !== undefined) row.phone = client.phone
  if (client.address !== undefined) row.address = client.address
  if (client.notes !== undefined) row.notes = client.notes
  if (client.imageUrl !== undefined) row.image_url = client.imageUrl
  if (client.preferredContactMethod !== undefined) row.preferred_contact_method = client.preferredContactMethod
  if (client.isNewClient !== undefined) row.is_new_client = client.isNewClient
  if (client.notificationPreferences !== undefined) row.notification_preferences = client.notificationPreferences
  return row
}

// ============================================
// Payment Method
// ============================================

export function mapPaymentMethod(row: DbRow): PaymentMethod {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type ?? 'card',
    card: {
      brand: (row.card_brand ?? 'unknown') as CardBrand,
      last4: row.card_last4 ?? '',
      expMonth: row.card_exp_month ?? 0,
      expYear: row.card_exp_year ?? 0,
    },
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
  }
}

export function toDbPaymentMethod(pm: Partial<PaymentMethod> & { clientId?: string }): DbRow {
  const row: DbRow = {}
  if (pm.clientId !== undefined) row.client_id = pm.clientId
  if (pm.type !== undefined) row.type = pm.type
  if (pm.card) {
    row.card_brand = pm.card.brand
    row.card_last4 = pm.card.last4
    row.card_exp_month = pm.card.expMonth
    row.card_exp_year = pm.card.expYear
  }
  if (pm.isDefault !== undefined) row.is_default = pm.isDefault
  return row
}

// ============================================
// Pet
// ============================================

export function mapPet(row: DbRow, vaccinations?: VaccinationRecord[]): Pet {
  return {
    id: row.id,
    clientId: row.client_id,
    organizationId: row.organization_id,
    name: row.name,
    species: row.species as PetSpecies,
    breed: row.breed ?? '',
    weight: Number(row.weight ?? 0),
    weightRange: row.weight_range as WeightRange,
    coatType: row.coat_type as CoatType,
    birthDate: row.birth_date ?? undefined,
    behaviorLevel: (row.behavior_level ?? 1) as BehaviorLevel,
    groomingNotes: row.grooming_notes ?? undefined,
    medicalNotes: row.medical_notes ?? undefined,
    imageUrl: row.image_url ?? undefined,
    vaccinations: vaccinations ?? [],
    lastGroomingDate: row.last_grooming_date ?? undefined,
    preferredGroomerId: row.preferred_groomer_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbPet(pet: Partial<Pet>): DbRow {
  const row: DbRow = {}
  if (pet.clientId !== undefined) row.client_id = pet.clientId
  if (pet.organizationId !== undefined) row.organization_id = pet.organizationId
  if (pet.name !== undefined) row.name = pet.name
  if (pet.species !== undefined) row.species = pet.species
  if (pet.breed !== undefined) row.breed = pet.breed
  if (pet.weight !== undefined) row.weight = pet.weight
  if (pet.weightRange !== undefined) row.weight_range = pet.weightRange
  if (pet.coatType !== undefined) row.coat_type = pet.coatType
  if (pet.birthDate !== undefined) row.birth_date = pet.birthDate
  if (pet.behaviorLevel !== undefined) row.behavior_level = pet.behaviorLevel
  if (pet.groomingNotes !== undefined) row.grooming_notes = pet.groomingNotes
  if (pet.medicalNotes !== undefined) row.medical_notes = pet.medicalNotes
  if (pet.imageUrl !== undefined) row.image_url = pet.imageUrl
  if (pet.lastGroomingDate !== undefined) row.last_grooming_date = pet.lastGroomingDate
  if (pet.preferredGroomerId !== undefined) row.preferred_groomer_id = pet.preferredGroomerId
  return row
}

// ============================================
// Vaccination Record
// ============================================

export function mapVaccinationRecord(row: DbRow): VaccinationRecord {
  return {
    id: row.id,
    name: row.name,
    dateAdministered: row.date_administered,
    expirationDate: row.expiration_date,
    documentUrl: row.document_url ?? undefined,
  }
}

export function toDbVaccinationRecord(vax: Partial<VaccinationRecord> & { petId?: string }): DbRow {
  const row: DbRow = {}
  if (vax.petId !== undefined) row.pet_id = vax.petId
  if (vax.name !== undefined) row.name = vax.name
  if (vax.dateAdministered !== undefined) row.date_administered = vax.dateAdministered
  if (vax.expirationDate !== undefined) row.expiration_date = vax.expirationDate
  if (vax.documentUrl !== undefined) row.document_url = vax.documentUrl
  return row
}

// ============================================
// Service
// ============================================

export function mapService(row: DbRow, modifiers?: ServiceModifier[]): Service {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description ?? '',
    baseDurationMinutes: row.base_duration_minutes,
    basePrice: Number(row.base_price),
    category: row.category,
    isActive: row.is_active ?? true,
    modifiers: modifiers ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbService(svc: Partial<Service>): DbRow {
  const row: DbRow = {}
  if (svc.organizationId !== undefined) row.organization_id = svc.organizationId
  if (svc.name !== undefined) row.name = svc.name
  if (svc.description !== undefined) row.description = svc.description
  if (svc.baseDurationMinutes !== undefined) row.base_duration_minutes = svc.baseDurationMinutes
  if (svc.basePrice !== undefined) row.base_price = svc.basePrice
  if (svc.category !== undefined) row.category = svc.category
  if (svc.isActive !== undefined) row.is_active = svc.isActive
  return row
}

// ============================================
// Service Modifier
// ============================================

export function mapServiceModifier(row: DbRow): ServiceModifier {
  return {
    id: row.id,
    serviceId: row.service_id,
    name: row.name,
    type: row.type,
    condition: row.condition ?? undefined,
    durationMinutes: row.duration_minutes ?? 0,
    priceAdjustment: Number(row.price_adjustment),
    isPercentage: row.is_percentage ?? false,
  }
}

export function toDbServiceModifier(mod: Partial<ServiceModifier>): DbRow {
  const row: DbRow = {}
  if (mod.serviceId !== undefined) row.service_id = mod.serviceId
  if (mod.name !== undefined) row.name = mod.name
  if (mod.type !== undefined) row.type = mod.type
  if (mod.condition !== undefined) row.condition = mod.condition
  if (mod.durationMinutes !== undefined) row.duration_minutes = mod.durationMinutes
  if (mod.priceAdjustment !== undefined) row.price_adjustment = mod.priceAdjustment
  if (mod.isPercentage !== undefined) row.is_percentage = mod.isPercentage
  return row
}

// ============================================
// Appointment
// ============================================

export function mapAppointment(row: DbRow, pets?: AppointmentPet[]): Appointment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    pets: pets ?? [],
    groomerId: row.groomer_id ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as AppointmentStatus,
    statusNotes: row.status_notes ?? undefined,
    internalNotes: row.internal_notes ?? undefined,
    clientNotes: row.client_notes ?? undefined,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
    depositPaid: row.deposit_paid ?? false,
    totalAmount: Number(row.total_amount ?? 0),
    tipAmount: row.tip_amount != null ? Number(row.tip_amount) : undefined,
    paymentStatus: row.payment_status as PaymentStatus | undefined,
    paidAt: row.paid_at ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbAppointment(apt: Partial<Appointment>): DbRow {
  const row: DbRow = {}
  if (apt.organizationId !== undefined) row.organization_id = apt.organizationId
  if (apt.clientId !== undefined) row.client_id = apt.clientId
  if (apt.groomerId !== undefined) row.groomer_id = apt.groomerId
  if (apt.startTime !== undefined) row.start_time = apt.startTime
  if (apt.endTime !== undefined) row.end_time = apt.endTime
  if (apt.status !== undefined) row.status = apt.status
  if (apt.statusNotes !== undefined) row.status_notes = apt.statusNotes
  if (apt.internalNotes !== undefined) row.internal_notes = apt.internalNotes
  if (apt.clientNotes !== undefined) row.client_notes = apt.clientNotes
  if (apt.depositAmount !== undefined) row.deposit_amount = apt.depositAmount
  if (apt.depositPaid !== undefined) row.deposit_paid = apt.depositPaid
  if (apt.totalAmount !== undefined) row.total_amount = apt.totalAmount
  if (apt.tipAmount !== undefined) row.tip_amount = apt.tipAmount
  if (apt.paymentStatus !== undefined) row.payment_status = apt.paymentStatus
  if (apt.paidAt !== undefined) row.paid_at = apt.paidAt
  if (apt.transactionId !== undefined) row.transaction_id = apt.transactionId
  return row
}

// ============================================
// Groomer
// ============================================

export function mapGroomer(row: DbRow, availability?: StaffAvailability, timeOff?: TimeOffRequest[]): Groomer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id ?? undefined,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? '',
    specialties: row.specialties ?? [],
    imageUrl: row.image_url ?? undefined,
    isActive: row.is_active ?? true,
    role: row.role as StaffRole,
    availability,
    timeOff,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDbGroomer(g: Partial<Groomer>): DbRow {
  const row: DbRow = {}
  if (g.organizationId !== undefined) row.organization_id = g.organizationId
  if (g.userId !== undefined) row.user_id = g.userId
  if (g.firstName !== undefined) row.first_name = g.firstName
  if (g.lastName !== undefined) row.last_name = g.lastName
  if (g.email !== undefined) row.email = g.email
  if (g.phone !== undefined) row.phone = g.phone
  if (g.specialties !== undefined) row.specialties = g.specialties
  if (g.imageUrl !== undefined) row.image_url = g.imageUrl
  if (g.isActive !== undefined) row.is_active = g.isActive
  if (g.role !== undefined) row.role = g.role
  return row
}

// ============================================
// Staff Availability
// ============================================

export function mapStaffAvailability(row: DbRow): StaffAvailability {
  return {
    id: row.id,
    staffId: row.staff_id,
    weeklySchedule: (row.weekly_schedule ?? []) as DaySchedule[],
    maxAppointmentsPerDay: row.max_appointments_per_day ?? 8,
    bufferMinutesBetweenAppointments: row.buffer_minutes_between_appointments ?? 15,
    updatedAt: row.updated_at,
  }
}

export function toDbStaffAvailability(sa: Partial<StaffAvailability>): DbRow {
  const row: DbRow = {}
  if (sa.staffId !== undefined) row.staff_id = sa.staffId
  if (sa.weeklySchedule !== undefined) row.weekly_schedule = sa.weeklySchedule
  if (sa.maxAppointmentsPerDay !== undefined) row.max_appointments_per_day = sa.maxAppointmentsPerDay
  if (sa.bufferMinutesBetweenAppointments !== undefined) row.buffer_minutes_between_appointments = sa.bufferMinutesBetweenAppointments
  return row
}

// ============================================
// Time Off Request
// ============================================

export function mapTimeOffRequest(row: DbRow): TimeOffRequest {
  return {
    id: row.id,
    staffId: row.staff_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason ?? undefined,
    status: row.status ?? 'pending',
    createdAt: row.created_at,
  }
}

export function toDbTimeOffRequest(tor: Partial<TimeOffRequest>): DbRow {
  const row: DbRow = {}
  if (tor.staffId !== undefined) row.staff_id = tor.staffId
  if (tor.startDate !== undefined) row.start_date = tor.startDate
  if (tor.endDate !== undefined) row.end_date = tor.endDate
  if (tor.reason !== undefined) row.reason = tor.reason
  if (tor.status !== undefined) row.status = tor.status
  return row
}

// ============================================
// Booking Policies
// ============================================

export function mapBookingPolicies(row: DbRow): BookingPolicies {
  return {
    id: row.id,
    organizationId: row.organization_id,
    newClientMode: row.new_client_mode ?? 'auto_confirm',
    existingClientMode: row.existing_client_mode ?? 'auto_confirm',
    depositRequired: row.deposit_required ?? false,
    depositPercentage: Number(row.deposit_percentage ?? 0),
    depositMinimum: Number(row.deposit_minimum ?? 0),
    noShowFeePercentage: Number(row.no_show_fee_percentage ?? 0),
    cancellationWindowHours: row.cancellation_window_hours ?? 24,
    lateCancellationFeePercentage: Number(row.late_cancellation_fee_percentage ?? 0),
    maxPetsPerAppointment: row.max_pets_per_appointment ?? 3,
    minAdvanceBookingHours: row.min_advance_booking_hours ?? 2,
    maxAdvanceBookingDays: row.max_advance_booking_days ?? 60,
    policyText: row.policy_text ?? '',
    updatedAt: row.updated_at,
  }
}

export function toDbBookingPolicies(bp: Partial<BookingPolicies>): DbRow {
  const row: DbRow = {}
  if (bp.organizationId !== undefined) row.organization_id = bp.organizationId
  if (bp.newClientMode !== undefined) row.new_client_mode = bp.newClientMode
  if (bp.existingClientMode !== undefined) row.existing_client_mode = bp.existingClientMode
  if (bp.depositRequired !== undefined) row.deposit_required = bp.depositRequired
  if (bp.depositPercentage !== undefined) row.deposit_percentage = bp.depositPercentage
  if (bp.depositMinimum !== undefined) row.deposit_minimum = bp.depositMinimum
  if (bp.noShowFeePercentage !== undefined) row.no_show_fee_percentage = bp.noShowFeePercentage
  if (bp.cancellationWindowHours !== undefined) row.cancellation_window_hours = bp.cancellationWindowHours
  if (bp.lateCancellationFeePercentage !== undefined) row.late_cancellation_fee_percentage = bp.lateCancellationFeePercentage
  if (bp.maxPetsPerAppointment !== undefined) row.max_pets_per_appointment = bp.maxPetsPerAppointment
  if (bp.minAdvanceBookingHours !== undefined) row.min_advance_booking_hours = bp.minAdvanceBookingHours
  if (bp.maxAdvanceBookingDays !== undefined) row.max_advance_booking_days = bp.maxAdvanceBookingDays
  if (bp.policyText !== undefined) row.policy_text = bp.policyText
  return row
}

// ============================================
// Reminder Schedule
// ============================================

export function mapReminderSchedule(row: DbRow): ReminderSchedule {
  return {
    id: row.id,
    organizationId: row.organization_id,
    appointmentReminders: row.appointment_reminders ?? {
      enabled48h: true, enabled24h: true, enabled2h: false,
      template48h: '', template24h: '', template2h: '',
    },
    dueForGrooming: row.due_for_grooming ?? {
      enabled: false, intervalDays: 42, template: '',
    },
    updatedAt: row.updated_at,
  }
}

export function toDbReminderSchedule(rs: Partial<ReminderSchedule>): DbRow {
  const row: DbRow = {}
  if (rs.organizationId !== undefined) row.organization_id = rs.organizationId
  if (rs.appointmentReminders !== undefined) row.appointment_reminders = rs.appointmentReminders
  if (rs.dueForGrooming !== undefined) row.due_for_grooming = rs.dueForGrooming
  return row
}

// ============================================
// Vaccination Reminder Settings
// ============================================

export function mapVaccinationReminderSettings(row: DbRow): VaccinationReminderSettings {
  return {
    id: row.id,
    organizationId: row.organization_id,
    enabled: row.enabled ?? true,
    reminderDays: row.reminder_days ?? [30, 7],
    channels: row.channels ?? { inApp: true, email: false, sms: false },
    blockBookingOnExpired: row.block_booking_on_expired ?? false,
    updatedAt: row.updated_at,
  }
}

export function toDbVaccinationReminderSettings(vrs: Partial<VaccinationReminderSettings>): DbRow {
  const row: DbRow = {}
  if (vrs.organizationId !== undefined) row.organization_id = vrs.organizationId
  if (vrs.enabled !== undefined) row.enabled = vrs.enabled
  if (vrs.reminderDays !== undefined) row.reminder_days = vrs.reminderDays
  if (vrs.channels !== undefined) row.channels = vrs.channels
  if (vrs.blockBookingOnExpired !== undefined) row.block_booking_on_expired = vrs.blockBookingOnExpired
  return row
}

// ============================================
// Vaccination Reminder
// ============================================

export function mapVaccinationReminder(row: DbRow): VaccinationReminder {
  return {
    id: row.id,
    petId: row.pet_id,
    clientId: row.client_id,
    vaccinationId: row.vaccination_id,
    vaccinationName: row.vaccination_name,
    expirationDate: row.expiration_date,
    reminderType: row.reminder_type,
    status: row.status ?? 'pending',
    channels: row.channels ?? [],
    sentAt: row.sent_at ?? undefined,
    createdAt: row.created_at,
  }
}

export function toDbVaccinationReminder(vr: Partial<VaccinationReminder>): DbRow {
  const row: DbRow = {}
  if (vr.petId !== undefined) row.pet_id = vr.petId
  if (vr.clientId !== undefined) row.client_id = vr.clientId
  if (vr.vaccinationId !== undefined) row.vaccination_id = vr.vaccinationId
  if (vr.vaccinationName !== undefined) row.vaccination_name = vr.vaccinationName
  if (vr.expirationDate !== undefined) row.expiration_date = vr.expirationDate
  if (vr.reminderType !== undefined) row.reminder_type = vr.reminderType
  if (vr.status !== undefined) row.status = vr.status
  if (vr.channels !== undefined) row.channels = vr.channels
  if (vr.sentAt !== undefined) row.sent_at = vr.sentAt
  return row
}

// ============================================
// In-App Notification
// ============================================

export function mapInAppNotification(row: DbRow): InAppNotification {
  return {
    id: row.id,
    organizationId: row.organization_id,
    type: row.type,
    title: row.title,
    message: row.message,
    petId: row.pet_id ?? undefined,
    clientId: row.client_id ?? undefined,
    read: row.read ?? false,
    createdAt: row.created_at,
  }
}

// ============================================
// Deleted Item
// ============================================

export function mapDeletedItem(row: DbRow): DeletedItem {
  return {
    id: row.id,
    entityType: row.entity_type as DeletedEntityType,
    entityId: row.entity_id,
    entityName: row.entity_name,
    data: row.data,
    deletedAt: row.deleted_at,
  }
}
