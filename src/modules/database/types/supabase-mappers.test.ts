import { describe, it, expect } from 'vitest'

import {
  mapOrganization,
  toDbOrganization,
  mapSubscription,
  mapBillingEvent,
  mapClient,
  toDbClient,
  mapPaymentMethod,
  toDbPaymentMethod,
  mapPet,
  toDbPet,
  mapVaccinationRecord,
  toDbVaccinationRecord,
  mapService,
  toDbService,
  mapServiceModifier,
  toDbServiceModifier,
  mapAppointment,
  toDbAppointment,
  mapGroomer,
  toDbGroomer,
  mapStaffAvailability,
  toDbStaffAvailability,
  mapTimeOffRequest,
  toDbTimeOffRequest,
  mapBookingPolicies,
  toDbBookingPolicies,
  mapReminderSchedule,
  toDbReminderSchedule,
  mapVaccinationReminderSettings,
  toDbVaccinationReminderSettings,
  mapVaccinationReminder,
  toDbVaccinationReminder,
  mapInAppNotification,
  mapDeletedItem,
} from './supabase-mappers'

import type {
  PaymentMethod,
  VaccinationRecord,
  ServiceModifier,
  AppointmentPet,
  StaffAvailability,
  TimeOffRequest,
  DaySchedule,
} from './index'

// ============================================
// Organization
// ============================================

describe('mapOrganization', () => {
  it('maps all fields from snake_case DB row to camelCase Organization', () => {
    const row = {
      id: 'org-1',
      name: 'Sit Pretty Club',
      slug: 'sit-pretty-club',
      address: '123 Main St',
      phone: '555-1234',
      email: 'hello@sitpretty.com',
      timezone: 'America/New_York',
      stripe_customer_id: 'cus_abc123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-06-15T12:00:00Z',
    }

    const result = mapOrganization(row)

    expect(result).toEqual({
      id: 'org-1',
      name: 'Sit Pretty Club',
      slug: 'sit-pretty-club',
      address: '123 Main St',
      phone: '555-1234',
      email: 'hello@sitpretty.com',
      timezone: 'America/New_York',
      stripeCustomerId: 'cus_abc123',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-06-15T12:00:00Z',
    })
  })

  it('applies defaults for null/missing optional fields', () => {
    const row = {
      id: 'org-2',
      name: 'Bare Bones Salon',
      slug: 'bare-bones',
      address: null,
      phone: null,
      email: null,
      timezone: null,
      stripe_customer_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapOrganization(row)

    expect(result.address).toBe('')
    expect(result.phone).toBe('')
    expect(result.email).toBe('')
    expect(result.timezone).toBe('America/Los_Angeles')
    expect(result.stripeCustomerId).toBeUndefined()
  })
})

describe('toDbOrganization', () => {
  it('maps camelCase Organization fields to snake_case DB row', () => {
    const org = {
      name: 'Sit Pretty Club',
      slug: 'sit-pretty-club',
      address: '123 Main St',
      phone: '555-1234',
      email: 'hello@sitpretty.com',
      timezone: 'America/New_York',
      stripeCustomerId: 'cus_abc123',
    }

    const result = toDbOrganization(org)

    expect(result).toEqual({
      name: 'Sit Pretty Club',
      slug: 'sit-pretty-club',
      address: '123 Main St',
      phone: '555-1234',
      email: 'hello@sitpretty.com',
      timezone: 'America/New_York',
      stripe_customer_id: 'cus_abc123',
    })
  })

  it('only includes defined fields (partial update)', () => {
    const result = toDbOrganization({ name: 'Updated Name' })

    expect(result).toEqual({ name: 'Updated Name' })
    expect(result).not.toHaveProperty('slug')
    expect(result).not.toHaveProperty('address')
  })

  it('returns empty object for empty input', () => {
    expect(toDbOrganization({})).toEqual({})
  })
})

describe('Organization round-trip', () => {
  it('preserves data through map -> toDb -> map cycle', () => {
    const originalRow = {
      id: 'org-rt',
      name: 'Round Trip Salon',
      slug: 'round-trip',
      address: '456 Oak Ave',
      phone: '555-9999',
      email: 'rt@test.com',
      timezone: 'America/Chicago',
      stripe_customer_id: 'cus_rt',
      created_at: '2025-03-01T00:00:00Z',
      updated_at: '2025-03-01T00:00:00Z',
    }

    const mapped = mapOrganization(originalRow)
    const dbRow = toDbOrganization(mapped)

    expect(dbRow.name).toBe(originalRow.name)
    expect(dbRow.slug).toBe(originalRow.slug)
    expect(dbRow.address).toBe(originalRow.address)
    expect(dbRow.phone).toBe(originalRow.phone)
    expect(dbRow.email).toBe(originalRow.email)
    expect(dbRow.timezone).toBe(originalRow.timezone)
    expect(dbRow.stripe_customer_id).toBe(originalRow.stripe_customer_id)
  })
})

// ============================================
// Subscription
// ============================================

describe('mapSubscription', () => {
  it('maps all fields from DB row to Subscription', () => {
    const row = {
      id: 'sub-1',
      organization_id: 'org-1',
      stripe_customer_id: 'cus_abc',
      stripe_subscription_id: 'sub_xyz',
      plan_tier: 'studio',
      billing_interval: 'monthly',
      status: 'active',
      trial_start: '2025-01-01T00:00:00Z',
      trial_end: '2025-01-15T00:00:00Z',
      current_period_start: '2025-01-15T00:00:00Z',
      current_period_end: '2025-02-15T00:00:00Z',
      cancel_at_period_end: false,
      canceled_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    }

    const result = mapSubscription(row)

    expect(result).toEqual({
      id: 'sub-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_abc',
      stripeSubscriptionId: 'sub_xyz',
      planTier: 'studio',
      billingInterval: 'monthly',
      status: 'active',
      trialStart: '2025-01-01T00:00:00Z',
      trialEnd: '2025-01-15T00:00:00Z',
      currentPeriodStart: '2025-01-15T00:00:00Z',
      currentPeriodEnd: '2025-02-15T00:00:00Z',
      cancelAtPeriodEnd: false,
      canceledAt: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    })
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'sub-2',
      organization_id: 'org-2',
      stripe_customer_id: 'cus_def',
      stripe_subscription_id: null,
      plan_tier: 'solo',
      billing_interval: 'yearly',
      status: 'trialing',
      trial_start: null,
      trial_end: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: null,
      canceled_at: null,
      created_at: '2025-05-01T00:00:00Z',
      updated_at: '2025-05-01T00:00:00Z',
    }

    const result = mapSubscription(row)

    expect(result.stripeSubscriptionId).toBeNull()
    expect(result.trialStart).toBeNull()
    expect(result.trialEnd).toBeNull()
    expect(result.currentPeriodStart).toBeNull()
    expect(result.currentPeriodEnd).toBeNull()
    expect(result.cancelAtPeriodEnd).toBe(false)
    expect(result.canceledAt).toBeNull()
  })
})

// ============================================
// Billing Event
// ============================================

describe('mapBillingEvent', () => {
  it('maps all fields from DB row to BillingEvent', () => {
    const payload = { subscription_id: 'sub_xyz', amount: 9500 }
    const row = {
      id: 'be-1',
      stripe_event_id: 'evt_abc123',
      event_type: 'invoice.payment_succeeded',
      organization_id: 'org-1',
      payload,
      processed_at: '2025-02-01T12:00:00Z',
    }

    const result = mapBillingEvent(row)

    expect(result).toEqual({
      id: 'be-1',
      stripeEventId: 'evt_abc123',
      eventType: 'invoice.payment_succeeded',
      organizationId: 'org-1',
      payload,
      processedAt: '2025-02-01T12:00:00Z',
    })
  })

  it('handles null organization_id', () => {
    const row = {
      id: 'be-2',
      stripe_event_id: 'evt_def',
      event_type: 'checkout.session.completed',
      organization_id: null,
      payload: {},
      processed_at: '2025-02-01T12:00:00Z',
    }

    expect(mapBillingEvent(row).organizationId).toBeNull()
  })
})

// ============================================
// Client
// ============================================

describe('mapClient', () => {
  it('maps all fields from DB row to Client', () => {
    const notifPrefs = {
      vaccinationReminders: { enabled: true, channels: ['email' as const] },
      appointmentReminders: { enabled: true, channels: ['email' as const] },
    }
    const row = {
      id: 'client-1',
      organization_id: 'org-1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '555-0101',
      address: '789 Elm St',
      notes: 'Prefers morning slots',
      image_url: 'https://example.com/jane.jpg',
      preferred_contact_method: 'phone',
      is_new_client: false,
      notification_preferences: notifPrefs,
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    }

    const paymentMethods: PaymentMethod[] = [
      {
        id: 'pm-1',
        clientId: 'client-1',
        type: 'card',
        card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027 },
        isDefault: true,
        createdAt: '2025-01-10T00:00:00Z',
      },
    ]

    const result = mapClient(row, paymentMethods)

    expect(result.id).toBe('client-1')
    expect(result.organizationId).toBe('org-1')
    expect(result.firstName).toBe('Jane')
    expect(result.lastName).toBe('Doe')
    expect(result.email).toBe('jane@example.com')
    expect(result.phone).toBe('555-0101')
    expect(result.address).toBe('789 Elm St')
    expect(result.notes).toBe('Prefers morning slots')
    expect(result.imageUrl).toBe('https://example.com/jane.jpg')
    expect(result.preferredContactMethod).toBe('phone')
    expect(result.isNewClient).toBe(false)
    expect(result.notificationPreferences).toEqual(notifPrefs)
    expect(result.paymentMethods).toEqual(paymentMethods)
  })

  it('applies defaults for null/missing optional fields', () => {
    const row = {
      id: 'client-2',
      organization_id: 'org-1',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com',
      phone: '555-0202',
      address: null,
      notes: null,
      image_url: null,
      preferred_contact_method: null,
      is_new_client: null,
      notification_preferences: null,
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z',
    }

    const result = mapClient(row)

    expect(result.address).toBeUndefined()
    expect(result.notes).toBeUndefined()
    expect(result.imageUrl).toBeUndefined()
    expect(result.preferredContactMethod).toBe('email')
    expect(result.isNewClient).toBe(true)
    expect(result.paymentMethods).toEqual([])
  })
})

describe('toDbClient', () => {
  it('maps camelCase Client fields to snake_case DB row', () => {
    const client = {
      organizationId: 'org-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-0101',
      address: '789 Elm St',
      notes: 'Prefers morning',
      imageUrl: 'https://example.com/jane.jpg',
      preferredContactMethod: 'phone' as const,
      isNewClient: false,
      notificationPreferences: {
        vaccinationReminders: { enabled: true, channels: ['email' as const] },
        appointmentReminders: { enabled: true, channels: ['email' as const] },
      },
    }

    const result = toDbClient(client)

    expect(result.organization_id).toBe('org-1')
    expect(result.first_name).toBe('Jane')
    expect(result.last_name).toBe('Doe')
    expect(result.email).toBe('jane@example.com')
    expect(result.phone).toBe('555-0101')
    expect(result.address).toBe('789 Elm St')
    expect(result.notes).toBe('Prefers morning')
    expect(result.image_url).toBe('https://example.com/jane.jpg')
    expect(result.preferred_contact_method).toBe('phone')
    expect(result.is_new_client).toBe(false)
    expect(result.notification_preferences).toEqual(client.notificationPreferences)
  })

  it('only includes defined fields (partial update)', () => {
    const result = toDbClient({ firstName: 'Updated' })

    expect(result).toEqual({ first_name: 'Updated' })
    expect(Object.keys(result)).toHaveLength(1)
  })
})

// ============================================
// Payment Method
// ============================================

describe('mapPaymentMethod', () => {
  it('maps all fields from DB row to PaymentMethod', () => {
    const row = {
      id: 'pm-1',
      client_id: 'client-1',
      type: 'card',
      card_brand: 'amex',
      card_last4: '3782',
      card_exp_month: 6,
      card_exp_year: 2028,
      is_default: true,
      created_at: '2025-03-01T00:00:00Z',
    }

    const result = mapPaymentMethod(row)

    expect(result).toEqual({
      id: 'pm-1',
      clientId: 'client-1',
      type: 'card',
      card: {
        brand: 'amex',
        last4: '3782',
        expMonth: 6,
        expYear: 2028,
      },
      isDefault: true,
      createdAt: '2025-03-01T00:00:00Z',
    })
  })

  it('applies defaults for null card and flag fields', () => {
    const row = {
      id: 'pm-2',
      client_id: 'client-2',
      type: null,
      card_brand: null,
      card_last4: null,
      card_exp_month: null,
      card_exp_year: null,
      is_default: null,
      created_at: '2025-03-01T00:00:00Z',
    }

    const result = mapPaymentMethod(row)

    expect(result.type).toBe('card')
    expect(result.card.brand).toBe('unknown')
    expect(result.card.last4).toBe('')
    expect(result.card.expMonth).toBe(0)
    expect(result.card.expYear).toBe(0)
    expect(result.isDefault).toBe(false)
  })
})

describe('toDbPaymentMethod', () => {
  it('maps PaymentMethod to DB row with flattened card fields', () => {
    const pm = {
      clientId: 'client-1',
      type: 'card' as const,
      card: {
        brand: 'visa' as const,
        last4: '4242',
        expMonth: 12,
        expYear: 2027,
      },
      isDefault: true,
    }

    const result = toDbPaymentMethod(pm)

    expect(result).toEqual({
      client_id: 'client-1',
      type: 'card',
      card_brand: 'visa',
      card_last4: '4242',
      card_exp_month: 12,
      card_exp_year: 2027,
      is_default: true,
    })
  })

  it('omits card fields when card object is not provided', () => {
    const result = toDbPaymentMethod({ clientId: 'client-1' })

    expect(result).toEqual({ client_id: 'client-1' })
    expect(result).not.toHaveProperty('card_brand')
    expect(result).not.toHaveProperty('card_last4')
  })
})

// ============================================
// Pet
// ============================================

describe('mapPet', () => {
  it('maps all fields from DB row to Pet', () => {
    const row = {
      id: 'pet-1',
      client_id: 'client-1',
      organization_id: 'org-1',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      weight: '35.5',
      weight_range: 'large',
      coat_type: 'long',
      birth_date: '2020-06-15',
      behavior_level: 2,
      grooming_notes: 'Sensitive ears',
      medical_notes: 'Hip dysplasia',
      image_url: 'https://example.com/buddy.jpg',
      last_grooming_date: '2025-01-20',
      preferred_groomer_id: 'groomer-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-20T00:00:00Z',
    }

    const vaccinations: VaccinationRecord[] = [
      {
        id: 'vax-1',
        name: 'Rabies',
        dateAdministered: '2024-06-01',
        expirationDate: '2025-06-01',
        documentUrl: 'https://example.com/rabies.pdf',
      },
    ]

    const result = mapPet(row, vaccinations)

    expect(result.id).toBe('pet-1')
    expect(result.clientId).toBe('client-1')
    expect(result.organizationId).toBe('org-1')
    expect(result.name).toBe('Buddy')
    expect(result.species).toBe('dog')
    expect(result.breed).toBe('Golden Retriever')
    expect(result.weight).toBe(35.5)
    expect(result.weightRange).toBe('large')
    expect(result.coatType).toBe('long')
    expect(result.birthDate).toBe('2020-06-15')
    expect(result.behaviorLevel).toBe(2)
    expect(result.groomingNotes).toBe('Sensitive ears')
    expect(result.medicalNotes).toBe('Hip dysplasia')
    expect(result.imageUrl).toBe('https://example.com/buddy.jpg')
    expect(result.lastGroomingDate).toBe('2025-01-20')
    expect(result.preferredGroomerId).toBe('groomer-1')
    expect(result.vaccinations).toEqual(vaccinations)
  })

  it('converts weight from string to number', () => {
    const row = {
      id: 'pet-2',
      client_id: 'c-1',
      organization_id: 'o-1',
      name: 'Max',
      species: 'dog',
      breed: '',
      weight: '0',
      weight_range: 'small',
      coat_type: 'short',
      behavior_level: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapPet(row)
    expect(result.weight).toBe(0)
    expect(typeof result.weight).toBe('number')
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'pet-3',
      client_id: 'c-1',
      organization_id: 'o-1',
      name: 'Kitty',
      species: 'cat',
      breed: null,
      weight: null,
      weight_range: 'small',
      coat_type: 'short',
      birth_date: null,
      behavior_level: null,
      grooming_notes: null,
      medical_notes: null,
      image_url: null,
      last_grooming_date: null,
      preferred_groomer_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapPet(row)

    expect(result.breed).toBe('')
    expect(result.weight).toBe(0)
    expect(result.birthDate).toBeUndefined()
    expect(result.behaviorLevel).toBe(1)
    expect(result.groomingNotes).toBeUndefined()
    expect(result.medicalNotes).toBeUndefined()
    expect(result.imageUrl).toBeUndefined()
    expect(result.vaccinations).toEqual([])
    expect(result.lastGroomingDate).toBeUndefined()
    expect(result.preferredGroomerId).toBeUndefined()
  })
})

describe('toDbPet', () => {
  it('maps camelCase Pet fields to snake_case DB row', () => {
    const pet = {
      clientId: 'client-1',
      organizationId: 'org-1',
      name: 'Buddy',
      species: 'dog' as const,
      breed: 'Golden Retriever',
      weight: 35.5,
      weightRange: 'large' as const,
      coatType: 'long' as const,
      birthDate: '2020-06-15',
      behaviorLevel: 2 as const,
      groomingNotes: 'Sensitive ears',
      medicalNotes: 'Hip dysplasia',
      imageUrl: 'https://example.com/buddy.jpg',
      lastGroomingDate: '2025-01-20',
      preferredGroomerId: 'groomer-1',
    }

    const result = toDbPet(pet)

    expect(result.client_id).toBe('client-1')
    expect(result.organization_id).toBe('org-1')
    expect(result.name).toBe('Buddy')
    expect(result.species).toBe('dog')
    expect(result.breed).toBe('Golden Retriever')
    expect(result.weight).toBe(35.5)
    expect(result.weight_range).toBe('large')
    expect(result.coat_type).toBe('long')
    expect(result.birth_date).toBe('2020-06-15')
    expect(result.behavior_level).toBe(2)
    expect(result.grooming_notes).toBe('Sensitive ears')
    expect(result.medical_notes).toBe('Hip dysplasia')
    expect(result.image_url).toBe('https://example.com/buddy.jpg')
    expect(result.last_grooming_date).toBe('2025-01-20')
    expect(result.preferred_groomer_id).toBe('groomer-1')
  })

  it('only includes defined fields (partial update)', () => {
    const result = toDbPet({ name: 'NewName', weight: 10 })

    expect(result).toEqual({ name: 'NewName', weight: 10 })
  })
})

// ============================================
// Vaccination Record
// ============================================

describe('mapVaccinationRecord', () => {
  it('maps all fields from DB row to VaccinationRecord', () => {
    const row = {
      id: 'vax-1',
      name: 'Rabies',
      date_administered: '2024-06-01',
      expiration_date: '2025-06-01',
      document_url: 'https://example.com/rabies.pdf',
    }

    const result = mapVaccinationRecord(row)

    expect(result).toEqual({
      id: 'vax-1',
      name: 'Rabies',
      dateAdministered: '2024-06-01',
      expirationDate: '2025-06-01',
      documentUrl: 'https://example.com/rabies.pdf',
    })
  })

  it('handles null document_url', () => {
    const row = {
      id: 'vax-2',
      name: 'DHPP',
      date_administered: '2024-09-01',
      expiration_date: '2025-09-01',
      document_url: null,
    }

    expect(mapVaccinationRecord(row).documentUrl).toBeUndefined()
  })
})

describe('toDbVaccinationRecord', () => {
  it('maps VaccinationRecord to DB row including petId', () => {
    const vax = {
      petId: 'pet-1',
      name: 'Rabies',
      dateAdministered: '2024-06-01',
      expirationDate: '2025-06-01',
      documentUrl: 'https://example.com/rabies.pdf',
    }

    const result = toDbVaccinationRecord(vax)

    expect(result).toEqual({
      pet_id: 'pet-1',
      name: 'Rabies',
      date_administered: '2024-06-01',
      expiration_date: '2025-06-01',
      document_url: 'https://example.com/rabies.pdf',
    })
  })

  it('returns empty object for empty input', () => {
    expect(toDbVaccinationRecord({})).toEqual({})
  })
})

// ============================================
// Service
// ============================================

describe('mapService', () => {
  it('maps all fields from DB row to Service', () => {
    const row = {
      id: 'svc-1',
      organization_id: 'org-1',
      name: 'Full Groom',
      description: 'Complete grooming package',
      base_duration_minutes: 90,
      base_price: '75.00',
      category: 'package',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const modifiers: ServiceModifier[] = [
      {
        id: 'mod-1',
        serviceId: 'svc-1',
        name: 'Large Dog Surcharge',
        type: 'weight',
        condition: { weightRange: ['large', 'xlarge'] },
        durationMinutes: 15,
        priceAdjustment: 20,
        isPercentage: false,
      },
    ]

    const result = mapService(row, modifiers)

    expect(result.id).toBe('svc-1')
    expect(result.organizationId).toBe('org-1')
    expect(result.name).toBe('Full Groom')
    expect(result.description).toBe('Complete grooming package')
    expect(result.baseDurationMinutes).toBe(90)
    expect(result.basePrice).toBe(75)
    expect(typeof result.basePrice).toBe('number')
    expect(result.category).toBe('package')
    expect(result.isActive).toBe(true)
    expect(result.modifiers).toEqual(modifiers)
  })

  it('applies defaults for null optional fields and converts price from string', () => {
    const row = {
      id: 'svc-2',
      organization_id: 'org-1',
      name: 'Nail Trim',
      description: null,
      base_duration_minutes: 15,
      base_price: '15',
      category: 'nail',
      is_active: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapService(row)

    expect(result.description).toBe('')
    expect(result.isActive).toBe(true)
    expect(result.modifiers).toEqual([])
    expect(result.basePrice).toBe(15)
  })
})

describe('toDbService', () => {
  it('maps camelCase Service fields to snake_case DB row', () => {
    const svc = {
      organizationId: 'org-1',
      name: 'Bath',
      description: 'Basic bath',
      baseDurationMinutes: 30,
      basePrice: 35,
      category: 'bath' as const,
      isActive: true,
    }

    const result = toDbService(svc)

    expect(result).toEqual({
      organization_id: 'org-1',
      name: 'Bath',
      description: 'Basic bath',
      base_duration_minutes: 30,
      base_price: 35,
      category: 'bath',
      is_active: true,
    })
  })
})

// ============================================
// Service Modifier
// ============================================

describe('mapServiceModifier', () => {
  it('maps all fields from DB row to ServiceModifier', () => {
    const row = {
      id: 'mod-1',
      service_id: 'svc-1',
      name: 'Long Coat Addon',
      type: 'coat',
      condition: { coatType: ['long', 'double'] },
      duration_minutes: 20,
      price_adjustment: '15.50',
      is_percentage: false,
    }

    const result = mapServiceModifier(row)

    expect(result).toEqual({
      id: 'mod-1',
      serviceId: 'svc-1',
      name: 'Long Coat Addon',
      type: 'coat',
      condition: { coatType: ['long', 'double'] },
      durationMinutes: 20,
      priceAdjustment: 15.5,
      isPercentage: false,
    })
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'mod-2',
      service_id: 'svc-1',
      name: 'Addon',
      type: 'addon',
      condition: null,
      duration_minutes: null,
      price_adjustment: '10',
      is_percentage: null,
    }

    const result = mapServiceModifier(row)

    expect(result.condition).toBeUndefined()
    expect(result.durationMinutes).toBe(0)
    expect(result.isPercentage).toBe(false)
  })
})

describe('toDbServiceModifier', () => {
  it('maps camelCase ServiceModifier fields to snake_case DB row', () => {
    const mod = {
      serviceId: 'svc-1',
      name: 'Weight Surcharge',
      type: 'weight' as const,
      condition: { weightRange: ['xlarge' as const] },
      durationMinutes: 10,
      priceAdjustment: 25,
      isPercentage: false,
    }

    const result = toDbServiceModifier(mod)

    expect(result).toEqual({
      service_id: 'svc-1',
      name: 'Weight Surcharge',
      type: 'weight',
      condition: { weightRange: ['xlarge'] },
      duration_minutes: 10,
      price_adjustment: 25,
      is_percentage: false,
    })
  })
})

// ============================================
// Appointment
// ============================================

describe('mapAppointment', () => {
  it('maps all fields from DB row to Appointment', () => {
    const row = {
      id: 'apt-1',
      organization_id: 'org-1',
      client_id: 'client-1',
      groomer_id: 'groomer-1',
      start_time: '2025-03-15T09:00:00Z',
      end_time: '2025-03-15T10:30:00Z',
      status: 'confirmed',
      status_notes: 'Confirmed by phone',
      internal_notes: 'Uses special shampoo',
      client_notes: 'Running 5 min late',
      deposit_amount: '25.00',
      deposit_paid: true,
      total_amount: '85.50',
      tip_amount: '12.00',
      payment_status: 'completed',
      paid_at: '2025-03-15T10:30:00Z',
      transaction_id: 'txn_abc123',
      created_at: '2025-03-10T00:00:00Z',
      updated_at: '2025-03-15T10:30:00Z',
    }

    const pets: AppointmentPet[] = [
      {
        petId: 'pet-1',
        services: [
          {
            serviceId: 'svc-1',
            appliedModifiers: ['mod-1'],
            finalDuration: 105,
            finalPrice: 95,
          },
        ],
      },
    ]

    const result = mapAppointment(row, pets)

    expect(result.id).toBe('apt-1')
    expect(result.organizationId).toBe('org-1')
    expect(result.clientId).toBe('client-1')
    expect(result.groomerId).toBe('groomer-1')
    expect(result.startTime).toBe('2025-03-15T09:00:00Z')
    expect(result.endTime).toBe('2025-03-15T10:30:00Z')
    expect(result.status).toBe('confirmed')
    expect(result.statusNotes).toBe('Confirmed by phone')
    expect(result.internalNotes).toBe('Uses special shampoo')
    expect(result.clientNotes).toBe('Running 5 min late')
    expect(result.depositAmount).toBe(25)
    expect(result.depositPaid).toBe(true)
    expect(result.totalAmount).toBe(85.5)
    expect(result.tipAmount).toBe(12)
    expect(result.paymentStatus).toBe('completed')
    expect(result.paidAt).toBe('2025-03-15T10:30:00Z')
    expect(result.transactionId).toBe('txn_abc123')
    expect(result.pets).toEqual(pets)
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'apt-2',
      organization_id: 'org-1',
      client_id: 'client-2',
      groomer_id: null,
      start_time: '2025-04-01T14:00:00Z',
      end_time: '2025-04-01T15:00:00Z',
      status: 'requested',
      status_notes: null,
      internal_notes: null,
      client_notes: null,
      deposit_amount: null,
      deposit_paid: null,
      total_amount: null,
      tip_amount: null,
      payment_status: null,
      paid_at: null,
      transaction_id: null,
      created_at: '2025-03-28T00:00:00Z',
      updated_at: '2025-03-28T00:00:00Z',
    }

    const result = mapAppointment(row)

    expect(result.groomerId).toBeUndefined()
    expect(result.statusNotes).toBeUndefined()
    expect(result.internalNotes).toBeUndefined()
    expect(result.clientNotes).toBeUndefined()
    expect(result.depositAmount).toBeUndefined()
    expect(result.depositPaid).toBe(false)
    expect(result.totalAmount).toBe(0)
    expect(result.tipAmount).toBeUndefined()
    // payment_status uses `as` cast (not ??), so null passes through as null at runtime
    expect(result.paymentStatus).toBeNull()
    expect(result.paidAt).toBeUndefined()
    expect(result.transactionId).toBeUndefined()
    expect(result.pets).toEqual([])
  })

  it('correctly casts enum values for status and paymentStatus', () => {
    const statuses = ['requested', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']

    statuses.forEach((status) => {
      const row = {
        id: `apt-${status}`,
        organization_id: 'org-1',
        client_id: 'c-1',
        start_time: '2025-04-01T14:00:00Z',
        end_time: '2025-04-01T15:00:00Z',
        status,
        total_amount: '0',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }
      expect(mapAppointment(row).status).toBe(status)
    })
  })
})

describe('toDbAppointment', () => {
  it('maps camelCase Appointment fields to snake_case DB row', () => {
    const apt = {
      organizationId: 'org-1',
      clientId: 'client-1',
      groomerId: 'groomer-1',
      startTime: '2025-03-15T09:00:00Z',
      endTime: '2025-03-15T10:30:00Z',
      status: 'confirmed' as const,
      statusNotes: 'Confirmed',
      internalNotes: 'Note',
      clientNotes: 'Client note',
      depositAmount: 25,
      depositPaid: true,
      totalAmount: 85.5,
      tipAmount: 12,
      paymentStatus: 'completed' as const,
      paidAt: '2025-03-15T10:30:00Z',
      transactionId: 'txn_abc',
    }

    const result = toDbAppointment(apt)

    expect(result.organization_id).toBe('org-1')
    expect(result.client_id).toBe('client-1')
    expect(result.groomer_id).toBe('groomer-1')
    expect(result.start_time).toBe('2025-03-15T09:00:00Z')
    expect(result.end_time).toBe('2025-03-15T10:30:00Z')
    expect(result.status).toBe('confirmed')
    expect(result.status_notes).toBe('Confirmed')
    expect(result.internal_notes).toBe('Note')
    expect(result.client_notes).toBe('Client note')
    expect(result.deposit_amount).toBe(25)
    expect(result.deposit_paid).toBe(true)
    expect(result.total_amount).toBe(85.5)
    expect(result.tip_amount).toBe(12)
    expect(result.payment_status).toBe('completed')
    expect(result.paid_at).toBe('2025-03-15T10:30:00Z')
    expect(result.transaction_id).toBe('txn_abc')
  })

  it('only includes defined fields (partial update)', () => {
    const result = toDbAppointment({ status: 'cancelled' })

    expect(result).toEqual({ status: 'cancelled' })
  })
})

// ============================================
// Groomer
// ============================================

describe('mapGroomer', () => {
  it('maps all fields from DB row to Groomer', () => {
    const row = {
      id: 'groomer-1',
      organization_id: 'org-1',
      user_id: 'user-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@sitpretty.com',
      phone: '555-0303',
      specialties: ['cats', 'anxious dogs'],
      image_url: 'https://example.com/sarah.jpg',
      is_active: true,
      role: 'groomer',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    }

    const availability: StaffAvailability = {
      id: 'avail-1',
      staffId: 'groomer-1',
      weeklySchedule: [],
      maxAppointmentsPerDay: 6,
      bufferMinutesBetweenAppointments: 20,
      updatedAt: '2025-01-01T00:00:00Z',
    }

    const timeOff: TimeOffRequest[] = [
      {
        id: 'tor-1',
        staffId: 'groomer-1',
        startDate: '2025-07-01',
        endDate: '2025-07-07',
        reason: 'Vacation',
        status: 'approved',
        createdAt: '2025-05-01T00:00:00Z',
      },
    ]

    const result = mapGroomer(row, availability, timeOff)

    expect(result.id).toBe('groomer-1')
    expect(result.organizationId).toBe('org-1')
    expect(result.userId).toBe('user-1')
    expect(result.firstName).toBe('Sarah')
    expect(result.lastName).toBe('Johnson')
    expect(result.email).toBe('sarah@sitpretty.com')
    expect(result.phone).toBe('555-0303')
    expect(result.specialties).toEqual(['cats', 'anxious dogs'])
    expect(result.imageUrl).toBe('https://example.com/sarah.jpg')
    expect(result.isActive).toBe(true)
    expect(result.role).toBe('groomer')
    expect(result.availability).toEqual(availability)
    expect(result.timeOff).toEqual(timeOff)
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'groomer-2',
      organization_id: 'org-1',
      user_id: null,
      first_name: 'Mike',
      last_name: 'Lee',
      email: 'mike@test.com',
      phone: null,
      specialties: null,
      image_url: null,
      is_active: null,
      role: 'admin',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapGroomer(row)

    expect(result.userId).toBeUndefined()
    expect(result.phone).toBe('')
    expect(result.specialties).toEqual([])
    expect(result.imageUrl).toBeUndefined()
    expect(result.isActive).toBe(true)
    expect(result.availability).toBeUndefined()
    expect(result.timeOff).toBeUndefined()
  })
})

describe('toDbGroomer', () => {
  it('maps camelCase Groomer fields to snake_case DB row', () => {
    const groomer = {
      organizationId: 'org-1',
      userId: 'user-1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@test.com',
      phone: '555-0303',
      specialties: ['cats'],
      imageUrl: 'https://example.com/sarah.jpg',
      isActive: true,
      role: 'groomer' as const,
    }

    const result = toDbGroomer(groomer)

    expect(result).toEqual({
      organization_id: 'org-1',
      user_id: 'user-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@test.com',
      phone: '555-0303',
      specialties: ['cats'],
      image_url: 'https://example.com/sarah.jpg',
      is_active: true,
      role: 'groomer',
    })
  })

  it('only includes defined fields (partial update)', () => {
    const result = toDbGroomer({ isActive: false })

    expect(result).toEqual({ is_active: false })
  })
})

// ============================================
// Staff Availability
// ============================================

describe('mapStaffAvailability', () => {
  it('maps all fields from DB row to StaffAvailability', () => {
    const schedule: DaySchedule[] = [
      { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, isWorkingDay: true, startTime: '09:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
    ]

    const row = {
      id: 'avail-1',
      staff_id: 'groomer-1',
      weekly_schedule: schedule,
      max_appointments_per_day: 10,
      buffer_minutes_between_appointments: 30,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapStaffAvailability(row)

    expect(result).toEqual({
      id: 'avail-1',
      staffId: 'groomer-1',
      weeklySchedule: schedule,
      maxAppointmentsPerDay: 10,
      bufferMinutesBetweenAppointments: 30,
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'avail-2',
      staff_id: 'groomer-2',
      weekly_schedule: null,
      max_appointments_per_day: null,
      buffer_minutes_between_appointments: null,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapStaffAvailability(row)

    expect(result.weeklySchedule).toEqual([])
    expect(result.maxAppointmentsPerDay).toBe(8)
    expect(result.bufferMinutesBetweenAppointments).toBe(15)
  })
})

describe('toDbStaffAvailability', () => {
  it('maps camelCase StaffAvailability fields to snake_case DB row', () => {
    const schedule: DaySchedule[] = [
      { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
    ]

    const result = toDbStaffAvailability({
      staffId: 'groomer-1',
      weeklySchedule: schedule,
      maxAppointmentsPerDay: 10,
      bufferMinutesBetweenAppointments: 30,
    })

    expect(result).toEqual({
      staff_id: 'groomer-1',
      weekly_schedule: schedule,
      max_appointments_per_day: 10,
      buffer_minutes_between_appointments: 30,
    })
  })
})

// ============================================
// Time Off Request
// ============================================

describe('mapTimeOffRequest', () => {
  it('maps all fields from DB row to TimeOffRequest', () => {
    const row = {
      id: 'tor-1',
      staff_id: 'groomer-1',
      start_date: '2025-07-01',
      end_date: '2025-07-07',
      reason: 'Family vacation',
      status: 'approved',
      created_at: '2025-05-01T00:00:00Z',
    }

    const result = mapTimeOffRequest(row)

    expect(result).toEqual({
      id: 'tor-1',
      staffId: 'groomer-1',
      startDate: '2025-07-01',
      endDate: '2025-07-07',
      reason: 'Family vacation',
      status: 'approved',
      createdAt: '2025-05-01T00:00:00Z',
    })
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'tor-2',
      staff_id: 'groomer-2',
      start_date: '2025-08-01',
      end_date: '2025-08-03',
      reason: null,
      status: null,
      created_at: '2025-06-01T00:00:00Z',
    }

    const result = mapTimeOffRequest(row)

    expect(result.reason).toBeUndefined()
    expect(result.status).toBe('pending')
  })
})

describe('toDbTimeOffRequest', () => {
  it('maps camelCase TimeOffRequest fields to snake_case DB row', () => {
    const result = toDbTimeOffRequest({
      staffId: 'groomer-1',
      startDate: '2025-07-01',
      endDate: '2025-07-07',
      reason: 'Vacation',
      status: 'approved',
    })

    expect(result).toEqual({
      staff_id: 'groomer-1',
      start_date: '2025-07-01',
      end_date: '2025-07-07',
      reason: 'Vacation',
      status: 'approved',
    })
  })
})

// ============================================
// Booking Policies
// ============================================

describe('mapBookingPolicies', () => {
  it('maps all fields from DB row to BookingPolicies', () => {
    const row = {
      id: 'bp-1',
      organization_id: 'org-1',
      new_client_mode: 'request_only',
      existing_client_mode: 'auto_confirm',
      deposit_required: true,
      deposit_percentage: '25',
      deposit_minimum: '10.00',
      no_show_fee_percentage: '50',
      cancellation_window_hours: 48,
      late_cancellation_fee_percentage: '30',
      max_pets_per_appointment: 4,
      min_advance_booking_hours: 4,
      max_advance_booking_days: 90,
      policy_text: 'Please arrive 10 minutes early.',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapBookingPolicies(row)

    expect(result).toEqual({
      id: 'bp-1',
      organizationId: 'org-1',
      newClientMode: 'request_only',
      existingClientMode: 'auto_confirm',
      depositRequired: true,
      depositPercentage: 25,
      depositMinimum: 10,
      noShowFeePercentage: 50,
      cancellationWindowHours: 48,
      lateCancellationFeePercentage: 30,
      maxPetsPerAppointment: 4,
      minAdvanceBookingHours: 4,
      maxAdvanceBookingDays: 90,
      policyText: 'Please arrive 10 minutes early.',
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })

  it('applies defaults for all null fields', () => {
    const row = {
      id: 'bp-2',
      organization_id: 'org-1',
      new_client_mode: null,
      existing_client_mode: null,
      deposit_required: null,
      deposit_percentage: null,
      deposit_minimum: null,
      no_show_fee_percentage: null,
      cancellation_window_hours: null,
      late_cancellation_fee_percentage: null,
      max_pets_per_appointment: null,
      min_advance_booking_hours: null,
      max_advance_booking_days: null,
      policy_text: null,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapBookingPolicies(row)

    expect(result.newClientMode).toBe('auto_confirm')
    expect(result.existingClientMode).toBe('auto_confirm')
    expect(result.depositRequired).toBe(false)
    expect(result.depositPercentage).toBe(0)
    expect(result.depositMinimum).toBe(0)
    expect(result.noShowFeePercentage).toBe(0)
    expect(result.cancellationWindowHours).toBe(24)
    expect(result.lateCancellationFeePercentage).toBe(0)
    expect(result.maxPetsPerAppointment).toBe(3)
    expect(result.minAdvanceBookingHours).toBe(2)
    expect(result.maxAdvanceBookingDays).toBe(60)
    expect(result.policyText).toBe('')
  })
})

describe('toDbBookingPolicies', () => {
  it('maps camelCase BookingPolicies fields to snake_case DB row', () => {
    const bp = {
      organizationId: 'org-1',
      newClientMode: 'blocked' as const,
      existingClientMode: 'request_only' as const,
      depositRequired: true,
      depositPercentage: 25,
      depositMinimum: 10,
      noShowFeePercentage: 50,
      cancellationWindowHours: 48,
      lateCancellationFeePercentage: 30,
      maxPetsPerAppointment: 4,
      minAdvanceBookingHours: 4,
      maxAdvanceBookingDays: 90,
      policyText: 'Policy text here',
    }

    const result = toDbBookingPolicies(bp)

    expect(result.organization_id).toBe('org-1')
    expect(result.new_client_mode).toBe('blocked')
    expect(result.existing_client_mode).toBe('request_only')
    expect(result.deposit_required).toBe(true)
    expect(result.deposit_percentage).toBe(25)
    expect(result.deposit_minimum).toBe(10)
    expect(result.no_show_fee_percentage).toBe(50)
    expect(result.cancellation_window_hours).toBe(48)
    expect(result.late_cancellation_fee_percentage).toBe(30)
    expect(result.max_pets_per_appointment).toBe(4)
    expect(result.min_advance_booking_hours).toBe(4)
    expect(result.max_advance_booking_days).toBe(90)
    expect(result.policy_text).toBe('Policy text here')
  })

  it('only includes defined fields (partial update)', () => {
    const result = toDbBookingPolicies({ depositRequired: false })

    expect(result).toEqual({ deposit_required: false })
  })
})

// ============================================
// Reminder Schedule
// ============================================

describe('mapReminderSchedule', () => {
  it('maps all fields from DB row to ReminderSchedule', () => {
    const appointmentReminders = {
      enabled48h: true,
      enabled24h: true,
      enabled2h: true,
      template48h: 'Reminder: 48h',
      template24h: 'Reminder: 24h',
      template2h: 'Reminder: 2h',
    }

    const dueForGrooming = {
      enabled: true,
      intervalDays: 30,
      template: 'Time for a groom!',
    }

    const row = {
      id: 'rs-1',
      organization_id: 'org-1',
      appointment_reminders: appointmentReminders,
      due_for_grooming: dueForGrooming,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapReminderSchedule(row)

    expect(result).toEqual({
      id: 'rs-1',
      organizationId: 'org-1',
      appointmentReminders,
      dueForGrooming,
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })

  it('applies defaults for null JSON fields', () => {
    const row = {
      id: 'rs-2',
      organization_id: 'org-2',
      appointment_reminders: null,
      due_for_grooming: null,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapReminderSchedule(row)

    expect(result.appointmentReminders).toEqual({
      enabled48h: true,
      enabled24h: true,
      enabled2h: false,
      template48h: '',
      template24h: '',
      template2h: '',
    })
    expect(result.dueForGrooming).toEqual({
      enabled: false,
      intervalDays: 42,
      template: '',
    })
  })
})

describe('toDbReminderSchedule', () => {
  it('maps camelCase ReminderSchedule fields to snake_case DB row', () => {
    const appointmentReminders = {
      enabled48h: true,
      enabled24h: false,
      enabled2h: false,
      template48h: 'T48',
      template24h: 'T24',
      template2h: 'T2',
    }

    const result = toDbReminderSchedule({
      organizationId: 'org-1',
      appointmentReminders,
      dueForGrooming: { enabled: true, intervalDays: 30, template: 'Groom' },
    })

    expect(result.organization_id).toBe('org-1')
    expect(result.appointment_reminders).toEqual(appointmentReminders)
    expect(result.due_for_grooming).toEqual({ enabled: true, intervalDays: 30, template: 'Groom' })
  })
})

// ============================================
// Vaccination Reminder Settings
// ============================================

describe('mapVaccinationReminderSettings', () => {
  it('maps all fields from DB row to VaccinationReminderSettings', () => {
    const row = {
      id: 'vrs-1',
      organization_id: 'org-1',
      enabled: true,
      reminder_days: [30, 14, 7],
      channels: { inApp: true, email: true },
      block_booking_on_expired: true,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapVaccinationReminderSettings(row)

    expect(result).toEqual({
      id: 'vrs-1',
      organizationId: 'org-1',
      enabled: true,
      reminderDays: [30, 14, 7],
      channels: { inApp: true, email: true },
      blockBookingOnExpired: true,
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })

  it('applies defaults for null fields', () => {
    const row = {
      id: 'vrs-2',
      organization_id: 'org-2',
      enabled: null,
      reminder_days: null,
      channels: null,
      block_booking_on_expired: null,
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapVaccinationReminderSettings(row)

    expect(result.enabled).toBe(true)
    expect(result.reminderDays).toEqual([30, 7])
    expect(result.channels).toEqual({ inApp: true, email: true })
    expect(result.blockBookingOnExpired).toBe(false)
  })
})

describe('toDbVaccinationReminderSettings', () => {
  it('maps camelCase VaccinationReminderSettings fields to snake_case DB row', () => {
    const result = toDbVaccinationReminderSettings({
      organizationId: 'org-1',
      enabled: false,
      reminderDays: [14],
      channels: { inApp: false, email: true },
      blockBookingOnExpired: true,
    })

    expect(result).toEqual({
      organization_id: 'org-1',
      enabled: false,
      reminder_days: [14],
      channels: { inApp: false, email: true },
      block_booking_on_expired: true,
    })
  })
})

// ============================================
// Vaccination Reminder
// ============================================

describe('mapVaccinationReminder', () => {
  it('maps all fields from DB row to VaccinationReminder', () => {
    const row = {
      id: 'vr-1',
      pet_id: 'pet-1',
      client_id: 'client-1',
      vaccination_id: 'vax-1',
      vaccination_name: 'Rabies',
      expiration_date: '2025-06-01',
      reminder_type: '30_day',
      status: 'sent',
      channels: ['in_app', 'email'],
      sent_at: '2025-05-01T12:00:00Z',
      created_at: '2025-05-01T00:00:00Z',
    }

    const result = mapVaccinationReminder(row)

    expect(result).toEqual({
      id: 'vr-1',
      petId: 'pet-1',
      clientId: 'client-1',
      vaccinationId: 'vax-1',
      vaccinationName: 'Rabies',
      expirationDate: '2025-06-01',
      reminderType: '30_day',
      status: 'sent',
      channels: ['in_app', 'email'],
      sentAt: '2025-05-01T12:00:00Z',
      createdAt: '2025-05-01T00:00:00Z',
    })
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'vr-2',
      pet_id: 'pet-2',
      client_id: 'client-2',
      vaccination_id: 'vax-2',
      vaccination_name: 'DHPP',
      expiration_date: '2025-09-01',
      reminder_type: '7_day',
      status: null,
      channels: null,
      sent_at: null,
      created_at: '2025-08-25T00:00:00Z',
    }

    const result = mapVaccinationReminder(row)

    expect(result.status).toBe('pending')
    expect(result.channels).toEqual([])
    expect(result.sentAt).toBeUndefined()
  })
})

describe('toDbVaccinationReminder', () => {
  it('maps camelCase VaccinationReminder fields to snake_case DB row', () => {
    const result = toDbVaccinationReminder({
      petId: 'pet-1',
      clientId: 'client-1',
      vaccinationId: 'vax-1',
      vaccinationName: 'Rabies',
      expirationDate: '2025-06-01',
      reminderType: '30_day',
      status: 'sent',
      channels: ['email'],
      sentAt: '2025-05-01T12:00:00Z',
    })

    expect(result).toEqual({
      pet_id: 'pet-1',
      client_id: 'client-1',
      vaccination_id: 'vax-1',
      vaccination_name: 'Rabies',
      expiration_date: '2025-06-01',
      reminder_type: '30_day',
      status: 'sent',
      channels: ['email'],
      sent_at: '2025-05-01T12:00:00Z',
    })
  })

  it('returns empty object for empty input', () => {
    expect(toDbVaccinationReminder({})).toEqual({})
  })
})

// ============================================
// In-App Notification
// ============================================

describe('mapInAppNotification', () => {
  it('maps all fields from DB row to InAppNotification', () => {
    const row = {
      id: 'notif-1',
      organization_id: 'org-1',
      type: 'vaccination_expiring',
      title: 'Vaccine Expiring',
      message: 'Buddy rabies vaccine expiring in 7 days',
      pet_id: 'pet-1',
      client_id: 'client-1',
      read: false,
      created_at: '2025-05-24T00:00:00Z',
    }

    const result = mapInAppNotification(row)

    expect(result).toEqual({
      id: 'notif-1',
      organizationId: 'org-1',
      type: 'vaccination_expiring',
      title: 'Vaccine Expiring',
      message: 'Buddy rabies vaccine expiring in 7 days',
      petId: 'pet-1',
      clientId: 'client-1',
      read: false,
      createdAt: '2025-05-24T00:00:00Z',
    })
  })

  it('applies defaults for null optional fields', () => {
    const row = {
      id: 'notif-2',
      organization_id: 'org-1',
      type: 'general',
      title: 'Welcome',
      message: 'Welcome to Sit Pretty Club',
      pet_id: null,
      client_id: null,
      read: null,
      created_at: '2025-01-01T00:00:00Z',
    }

    const result = mapInAppNotification(row)

    expect(result.petId).toBeUndefined()
    expect(result.clientId).toBeUndefined()
    expect(result.read).toBe(false)
  })
})

// ============================================
// Deleted Item
// ============================================

describe('mapDeletedItem', () => {
  it('maps all fields from DB row to DeletedItem', () => {
    const entityData = { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
    const row = {
      id: 'del-1',
      entity_type: 'client',
      entity_id: 'client-1',
      entity_name: 'Jane Doe',
      data: entityData,
      deleted_at: '2025-06-01T00:00:00Z',
    }

    const result = mapDeletedItem(row)

    expect(result).toEqual({
      id: 'del-1',
      entityType: 'client',
      entityId: 'client-1',
      entityName: 'Jane Doe',
      data: entityData,
      deletedAt: '2025-06-01T00:00:00Z',
    })
  })

  it('correctly casts entity type values', () => {
    const entityTypes = ['client', 'pet', 'groomer', 'service'] as const

    entityTypes.forEach((entityType) => {
      const row = {
        id: `del-${entityType}`,
        entity_type: entityType,
        entity_id: `${entityType}-1`,
        entity_name: `Test ${entityType}`,
        data: {},
        deleted_at: '2025-06-01T00:00:00Z',
      }

      expect(mapDeletedItem(row).entityType).toBe(entityType)
    })
  })
})

// ============================================
// Edge Cases: empty strings, zero values, empty arrays
// ============================================

describe('edge cases', () => {
  it('handles empty string values correctly in mapOrganization', () => {
    const row = {
      id: 'org-empty',
      name: '',
      slug: '',
      address: '',
      phone: '',
      email: '',
      timezone: '',
      stripe_customer_id: '',
      created_at: '',
      updated_at: '',
    }

    const result = mapOrganization(row)

    // Empty strings are truthy for ??, so they pass through
    expect(result.name).toBe('')
    expect(result.slug).toBe('')
    expect(result.address).toBe('')
    expect(result.phone).toBe('')
    expect(result.email).toBe('')
    expect(result.timezone).toBe('')
    expect(result.stripeCustomerId).toBe('')
  })

  it('handles zero numeric values correctly in mapAppointment', () => {
    const row = {
      id: 'apt-zero',
      organization_id: 'org-1',
      client_id: 'c-1',
      start_time: '2025-01-01T09:00:00Z',
      end_time: '2025-01-01T10:00:00Z',
      status: 'completed',
      deposit_amount: 0,
      deposit_paid: false,
      total_amount: 0,
      tip_amount: 0,
      payment_status: 'pending',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapAppointment(row)

    // deposit_amount: 0 is != null, so Number(0) = 0
    expect(result.depositAmount).toBe(0)
    expect(result.totalAmount).toBe(0)
    // tip_amount: 0 is != null, so Number(0) = 0
    expect(result.tipAmount).toBe(0)
  })

  it('handles empty arrays correctly in mapGroomer', () => {
    const row = {
      id: 'groomer-ea',
      organization_id: 'org-1',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@test.com',
      phone: '',
      specialties: [],
      is_active: true,
      role: 'groomer',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapGroomer(row)
    expect(result.specialties).toEqual([])
  })

  it('round-trips Client through map -> toDb correctly', () => {
    const originalRow = {
      id: 'client-rt',
      organization_id: 'org-1',
      first_name: 'Alice',
      last_name: 'Wonder',
      email: 'alice@example.com',
      phone: '555-0000',
      address: '100 Wonderland Ave',
      notes: 'VIP client',
      image_url: 'https://example.com/alice.jpg',
      preferred_contact_method: 'phone',
      is_new_client: false,
      notification_preferences: {
        vaccinationReminders: { enabled: true, channels: ['email'] },
        appointmentReminders: { enabled: false, channels: [] },
      },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    }

    const mapped = mapClient(originalRow)
    const dbRow = toDbClient(mapped)

    expect(dbRow.organization_id).toBe(originalRow.organization_id)
    expect(dbRow.first_name).toBe(originalRow.first_name)
    expect(dbRow.last_name).toBe(originalRow.last_name)
    expect(dbRow.email).toBe(originalRow.email)
    expect(dbRow.phone).toBe(originalRow.phone)
    expect(dbRow.address).toBe(originalRow.address)
    expect(dbRow.notes).toBe(originalRow.notes)
    expect(dbRow.image_url).toBe(originalRow.image_url)
    expect(dbRow.preferred_contact_method).toBe(originalRow.preferred_contact_method)
    expect(dbRow.is_new_client).toBe(originalRow.is_new_client)
    expect(dbRow.notification_preferences).toEqual(originalRow.notification_preferences)
  })

  it('round-trips Appointment through map -> toDb correctly', () => {
    const originalRow = {
      id: 'apt-rt',
      organization_id: 'org-1',
      client_id: 'c-1',
      groomer_id: 'g-1',
      start_time: '2025-05-01T09:00:00Z',
      end_time: '2025-05-01T10:30:00Z',
      status: 'in_progress',
      status_notes: 'On time',
      internal_notes: 'Regular',
      client_notes: 'Bring treats',
      deposit_amount: '20',
      deposit_paid: true,
      total_amount: '100',
      tip_amount: '15',
      payment_status: 'pending',
      paid_at: '2025-05-01T10:30:00Z',
      transaction_id: 'txn_rt',
      created_at: '2025-04-25T00:00:00Z',
      updated_at: '2025-05-01T10:30:00Z',
    }

    const mapped = mapAppointment(originalRow)
    const dbRow = toDbAppointment(mapped)

    expect(dbRow.organization_id).toBe(originalRow.organization_id)
    expect(dbRow.client_id).toBe(originalRow.client_id)
    expect(dbRow.groomer_id).toBe(originalRow.groomer_id)
    expect(dbRow.start_time).toBe(originalRow.start_time)
    expect(dbRow.end_time).toBe(originalRow.end_time)
    expect(dbRow.status).toBe(originalRow.status)
    expect(dbRow.status_notes).toBe(originalRow.status_notes)
    expect(dbRow.internal_notes).toBe(originalRow.internal_notes)
    expect(dbRow.client_notes).toBe(originalRow.client_notes)
    // deposit_amount is Number-cast on map, so dbRow gets numeric
    expect(dbRow.deposit_amount).toBe(20)
    expect(dbRow.deposit_paid).toBe(true)
    expect(dbRow.total_amount).toBe(100)
    expect(dbRow.tip_amount).toBe(15)
    expect(dbRow.payment_status).toBe(originalRow.payment_status)
    expect(dbRow.paid_at).toBe(originalRow.paid_at)
    expect(dbRow.transaction_id).toBe(originalRow.transaction_id)
  })
})
