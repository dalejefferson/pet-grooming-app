import type { Appointment, BookingState, Client, Pet, Service } from '../types'
import { clientsApi } from './clientsApi'
import { petsApi } from './petsApi'
import { servicesApi } from './servicesApi'
import { calendarApi } from './calendarApi'
import { policiesApi } from './policiesApi'
import { addMinutes, parseISO } from 'date-fns'
import {
  validateMaxPetsPerAppointment,
  validateAdvanceBooking,
  validatePetOwnership,
  validateVaccinationStatus,
  validateAppointmentDuration,
  BookingValidationError,
} from './validators'

export interface BookingResult {
  appointment: Appointment
  client: Client
  pets: Pet[]
  isNewClient: boolean
  requiresConfirmation: boolean
}

export const bookingApi = {
  async calculateAppointmentDetails(
    booking: BookingState
  ): Promise<{
    totalDuration: number
    totalPrice: number
    depositRequired: number
    pets: {
      petId: string
      services: {
        serviceId: string
        modifierIds: string[]
        duration: number
        price: number
      }[]
    }[]
  }> {
    const policies = await policiesApi.get(booking.organizationId)
    if (!policies) throw new BookingValidationError('Booking policies not found for this organization.')
    let totalDuration = 0
    let totalPrice = 0
    const serviceCache = new Map<string, Service>()
    const petDetails: {
      petId: string
      services: {
        serviceId: string
        modifierIds: string[]
        duration: number
        price: number
      }[]
    }[] = []

    for (const selectedPet of booking.selectedPets) {
      const petServices: {
        serviceId: string
        modifierIds: string[]
        duration: number
        price: number
      }[] = []

      for (const selectedService of selectedPet.services) {
        let service = serviceCache.get(selectedService.serviceId)
        if (!service) {
          const fetched = await servicesApi.getById(selectedService.serviceId)
          if (!fetched) continue
          service = fetched
          serviceCache.set(selectedService.serviceId, service)
        }

        let duration = service.baseDurationMinutes
        let price = service.basePrice

        // Apply modifiers
        for (const modifierId of selectedService.modifierIds) {
          const modifier = service.modifiers.find((m) => m.id === modifierId)
          if (!modifier) {
            throw new BookingValidationError(
              `Modifier "${modifierId}" not found on service "${service.name}". It may have been removed.`
            )
          }
          duration += modifier.durationMinutes
          if (modifier.isPercentage) {
            price += (service.basePrice * modifier.priceAdjustment) / 100
          } else {
            price += modifier.priceAdjustment
          }
        }

        petServices.push({
          serviceId: selectedService.serviceId,
          modifierIds: selectedService.modifierIds,
          duration,
          price,
        })

        totalDuration += duration
        totalPrice += price
      }

      // Existing pets must have a petId; new pets may not have one yet (assigned after creation)
      if (!selectedPet.isNewPet && !selectedPet.petId) {
        throw new BookingValidationError('Existing pet is missing a pet ID.')
      }

      petDetails.push({
        petId: selectedPet.petId || '',
        services: petServices,
      })
    }

    // Calculate deposit
    let depositRequired = 0
    if (policies.depositRequired) {
      const percentageDeposit = (totalPrice * policies.depositPercentage) / 100
      depositRequired = Math.max(percentageDeposit, policies.depositMinimum)
    }

    return {
      totalDuration,
      totalPrice,
      depositRequired,
      pets: petDetails,
    }
  },

  async createBooking(booking: BookingState): Promise<BookingResult> {
    const policies = await policiesApi.get(booking.organizationId)
    if (!policies) throw new BookingValidationError('Booking policies not found for this organization.')

    // Block new clients before creating any records to avoid orphaned data
    if (booking.isNewClient && policies.newClientMode === 'blocked') {
      throw new BookingValidationError(
        'This salon is not accepting new clients at this time. Please contact us directly.'
      )
    }

    // Validate max pets
    validateMaxPetsPerAppointment(booking.selectedPets.length, policies)

    // Validate advance booking window
    if (booking.selectedTimeSlot) {
      const startTime = `${booking.selectedTimeSlot.date}T${booking.selectedTimeSlot.startTime}`
      validateAdvanceBooking(startTime, policies)
    }

    let client: Client
    let isNewClient = false
    const createdPets: Pet[] = []

    // Create or get client
    if (booking.isNewClient && booking.clientInfo) {
      client = await clientsApi.create({
        organizationId: booking.organizationId,
        firstName: booking.clientInfo.firstName,
        lastName: booking.clientInfo.lastName,
        email: booking.clientInfo.email,
        phone: booking.clientInfo.phone,
        preferredContactMethod: 'email',
        isNewClient: true,
      })
      isNewClient = true
    } else if (booking.clientId) {
      const existingClient = await clientsApi.getByIdForBooking(booking.clientId, booking.organizationId)
      if (!existingClient) {
        throw new Error('Client not found')
      }
      client = existingClient
    } else {
      throw new Error('Client information required')
    }

    // Validate pet ownership and vaccinations for existing pets
    const existingPetsForValidation: Pet[] = []
    for (const selectedPet of booking.selectedPets) {
      if (!selectedPet.isNewPet && selectedPet.petId) {
        const pet = await petsApi.getByIdForBooking(selectedPet.petId, booking.organizationId)
        if (pet) existingPetsForValidation.push(pet)
      }
    }

    if (!booking.isNewClient && booking.clientId && existingPetsForValidation.length > 0) {
      validatePetOwnership(existingPetsForValidation, client.id)
    }

    // Check vaccination status for all existing pets
    if (existingPetsForValidation.length > 0) {
      const vaccinationResult = validateVaccinationStatus(existingPetsForValidation)
      if (vaccinationResult.hasExpired) {
        throw new BookingValidationError(
          `Cannot book: ${vaccinationResult.expiredPets.join(', ')} ${vaccinationResult.expiredPets.length === 1 ? 'has' : 'have'} expired vaccinations. Please update vaccination records before booking.`
        )
      }
    }

    // Create new pets if needed
    for (const selectedPet of booking.selectedPets) {
      if (selectedPet.isNewPet && selectedPet.petInfo) {
        const newPet = await petsApi.create({
          clientId: client.id,
          organizationId: booking.organizationId,
          name: selectedPet.petInfo.name || 'Unknown',
          species: selectedPet.petInfo.species || 'dog',
          breed: selectedPet.petInfo.breed || 'Unknown',
          weight: selectedPet.petInfo.weight || 0,
          weightRange: selectedPet.petInfo.weightRange || 'medium',
          coatType: selectedPet.petInfo.coatType || 'medium',
          behaviorLevel: selectedPet.petInfo.behaviorLevel || 3,
          vaccinations: [],
        })
        selectedPet.petId = newPet.id
        createdPets.push(newPet)
      }
    }

    // Calculate appointment details
    const details = await this.calculateAppointmentDetails(booking)

    // Validate appointment duration does not exceed maximum
    validateAppointmentDuration(details.totalDuration)

    // Validate deposit payment if required
    if (policies.depositRequired && details.depositRequired > 0) {
      if (booking.payment?.paymentStatus !== 'completed') {
        throw new BookingValidationError(
          `A deposit of $${details.depositRequired.toFixed(2)} is required to complete this booking.`
        )
      }
    }

    // Determine status based on policies
    let status: Appointment['status']
    if (isNewClient) {
      status = policies.newClientMode === 'auto_confirm' ? 'confirmed' : 'requested'
    } else {
      status = policies.existingClientMode === 'auto_confirm' ? 'confirmed' : 'requested'
    }

    // Parse time slot
    if (!booking.selectedTimeSlot) {
      throw new Error('Time slot required')
    }

    const startDate = parseISO(
      `${booking.selectedTimeSlot.date}T${booking.selectedTimeSlot.startTime}`
    )
    const endDate = addMinutes(startDate, details.totalDuration)

    // Create appointment with payment info and groomer
    const tipAmount = booking.payment?.tipAmount || 0
    const appointment = await calendarApi.create({
      organizationId: booking.organizationId,
      clientId: client.id,
      groomerId: booking.selectedGroomerId,
      pets: details.pets.map((p, i) => {
        const resolvedPetId = p.petId || booking.selectedPets[i].petId
        if (!resolvedPetId) {
          throw new BookingValidationError('Unable to resolve pet ID for appointment. Please try again.')
        }
        return {
          petId: resolvedPetId,
          services: p.services.map((s) => ({
            serviceId: s.serviceId,
            appliedModifiers: s.modifierIds,
            finalDuration: s.duration,
            finalPrice: s.price,
          })),
        }
      }),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status,
      clientNotes: booking.notes,
      depositAmount: details.depositRequired,
      depositPaid: booking.payment?.paymentStatus === 'completed',
      totalAmount: details.totalPrice + tipAmount,
      tipAmount,
      paymentStatus: booking.payment?.paymentStatus || 'pending',
      paidAt: booking.payment?.paidAt,
      transactionId: booking.payment?.transactionId,
    })

    // Get all pet details — reuse already-fetched existing pets instead of re-querying
    const allPets: Pet[] = [...createdPets, ...existingPetsForValidation]

    return {
      appointment,
      client,
      pets: allPets,
      isNewClient,
      requiresConfirmation: status === 'requested',
    }
  },

  async getServicesWithModifiers(
    organizationId: string
  ): Promise<Service[]> {
    return servicesApi.getActive(organizationId)
  },

  async validateTimeSlot(
    date: string,
    startTime: string,
    durationMinutes: number,
    organizationId: string,
    groomerId?: string
  ): Promise<boolean> {
    const dateObj = parseISO(`${date}T${startTime}`)
    const slots = await calendarApi.getAvailableSlots(
      dateObj,
      durationMinutes,
      organizationId,
      groomerId
    )

    const slot = slots.find(
      (s) => s.date === date && s.startTime === startTime
    )
    return slot?.available ?? false
  },
}
