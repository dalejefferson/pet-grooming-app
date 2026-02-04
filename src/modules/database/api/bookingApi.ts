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
    let totalDuration = 0
    let totalPrice = 0
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
        const service = await servicesApi.getById(selectedService.serviceId)
        if (!service) continue

        let duration = service.baseDurationMinutes
        let price = service.basePrice

        // Apply modifiers
        for (const modifierId of selectedService.modifierIds) {
          const modifier = service.modifiers.find((m) => m.id === modifierId)
          if (modifier) {
            duration += modifier.durationMinutes
            if (modifier.isPercentage) {
              price += (service.basePrice * modifier.priceAdjustment) / 100
            } else {
              price += modifier.priceAdjustment
            }
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
      const existingClient = await clientsApi.getById(booking.clientId)
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
        const pet = await petsApi.getById(selectedPet.petId)
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
      pets: details.pets.map((p, i) => ({
        petId: p.petId || booking.selectedPets[i].petId || '',
        services: p.services.map((s) => ({
          serviceId: s.serviceId,
          appliedModifiers: s.modifierIds,
          finalDuration: s.duration,
          finalPrice: s.price,
        })),
      })),
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

    // Get all pet details
    const allPets: Pet[] = [...createdPets]
    for (const selectedPet of booking.selectedPets) {
      if (!selectedPet.isNewPet && selectedPet.petId) {
        const pet = await petsApi.getById(selectedPet.petId)
        if (pet) allPets.push(pet)
      }
    }

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
