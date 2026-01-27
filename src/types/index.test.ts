import { describe, it, expect } from 'vitest'
import type {
  Organization,
  User,
  Client,
  Pet,
  BookingPolicies,
  AppointmentStatus,
} from './index'

describe('Type definitions', () => {
  it('should allow valid Organization type', () => {
    const org: Organization = {
      id: 'org-1',
      name: 'Test Org',
      slug: 'test-org',
      address: '123 Test St',
      phone: '555-1234',
      email: 'test@test.com',
      timezone: 'America/New_York',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
    expect(org.id).toBe('org-1')
  })

  it('should allow valid User type', () => {
    const user: User = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      role: 'admin',
      organizationId: 'org-1',
      createdAt: '2024-01-01',
    }
    expect(user.role).toBe('admin')
  })

  it('should allow valid Client type', () => {
    const client: Client = {
      id: 'client-1',
      organizationId: 'org-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '555-1234',
      preferredContactMethod: 'email',
      isNewClient: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
    expect(client.isNewClient).toBe(true)
  })

  it('should allow valid Pet type', () => {
    const pet: Pet = {
      id: 'pet-1',
      clientId: 'client-1',
      organizationId: 'org-1',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      weight: 70,
      weightRange: 'large',
      coatType: 'long',
      behaviorLevel: 2,
      vaccinations: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
    expect(pet.species).toBe('dog')
    expect(pet.behaviorLevel).toBe(2)
  })

  it('should validate AppointmentStatus values', () => {
    const validStatuses: AppointmentStatus[] = [
      'requested',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
    ]
    expect(validStatuses).toHaveLength(7)
  })

  it('should allow valid BookingPolicies type', () => {
    const policies: BookingPolicies = {
      id: 'policy-1',
      organizationId: 'org-1',
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
      policyText: 'Test policy',
      updatedAt: '2024-01-01',
    }
    expect(policies.depositRequired).toBe(true)
  })
})
