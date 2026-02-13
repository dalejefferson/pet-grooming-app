import { useState, useMemo } from 'react'
import { useNavigate, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Card, CardTitle, Button, Textarea, LoadingSpinner } from '../../components/common'
import {
  BookingSummaryCard,
  GroomerInfoCard,
  PetServicesList,
  TipSelector,
  BookingPriceBreakdown,
  PaymentForm,
  BookingPoliciesCard,
  NewClientNotice,
  ClientInfoCard,
} from '../../components/booking'
import type { PetServiceSummary } from '../../components/booking'
import type { CardInputValue } from '../../components/payment'
import { useActiveServices, usePolicies, useCreateBooking, useClientPets, useGroomers } from '@/hooks'
import { useAddPaymentMethod } from '@/modules/database/hooks'
import { useBookingContext } from '../../context/BookingContext'
import { emailApi } from '@/modules/database/api/emailApi'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO, addMinutes } from 'date-fns'
import type { BookingState, TipOption, PaymentStatus } from '@/types'

export function BookingConfirmPage() {
  const navigate = useNavigate()
  const { orgSlug } = useParams()
  const { organization, bookingState: ctxBookingState, updateBookingState } = useBookingContext()

  const isNewClient = ctxBookingState.isNewClient
  const clientId = ctxBookingState.clientId
  const date = ctxBookingState.selectedTimeSlot?.date || ''
  const time = ctxBookingState.selectedTimeSlot?.startTime || ''
  const groomerId = ctxBookingState.selectedGroomerId

  const selectedPets = ctxBookingState.selectedPets

  const clientInfo = isNewClient ? ctxBookingState.clientInfo : undefined

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: policies } = usePolicies(organization.id)
  const { data: clientPets = [] } = useClientPets(clientId || '')
  const { data: allGroomers = [] } = useGroomers()
  const createBooking = useCreateBooking()

  // Find the selected groomer
  const selectedGroomer = useMemo(() => {
    if (!groomerId) return null
    return allGroomers.find((g) => g.id === groomerId) || null
  }, [groomerId, allGroomers])

  const [notes, setNotes] = useState('')
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)

  // Tip and payment state
  const [selectedTip, setSelectedTip] = useState<TipOption>('none')
  const [customTipAmount, setCustomTipAmount] = useState<number>(0)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')

  // Payment method selection state
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null)
  const [newCardValue, setNewCardValue] = useState<CardInputValue | null>(null)
  const [saveNewCard, setSaveNewCard] = useState(false)

  const addPaymentMethod = useAddPaymentMethod()

  // Calculate totals
  const { totalDuration, totalPrice, depositRequired, petSummaries } = useMemo(() => {
    let duration = 0
    let price = 0
    const summaries: PetServiceSummary[] = []

    for (const pet of selectedPets) {
      const petName = pet.isNewPet
        ? pet.petInfo?.name || 'New Pet'
        : clientPets.find((p) => p.id === pet.petId)?.name || 'Pet'

      const petServices: { name: string; duration: number; price: number }[] = []

      for (const selectedService of pet.services) {
        const service = services.find((s) => s.id === selectedService.serviceId)
        if (service) {
          let serviceDuration = service.baseDurationMinutes
          let servicePrice = service.basePrice

          for (const modifierId of selectedService.modifierIds) {
            const modifier = service.modifiers.find((m) => m.id === modifierId)
            if (modifier) {
              serviceDuration += modifier.durationMinutes
              if (modifier.isPercentage) {
                servicePrice += (service.basePrice * modifier.priceAdjustment) / 100
              } else {
                servicePrice += modifier.priceAdjustment
              }
            }
          }

          duration += serviceDuration
          price += servicePrice
          petServices.push({
            name: service.name,
            duration: serviceDuration,
            price: servicePrice,
          })
        }
      }

      summaries.push({ name: petName, services: petServices })
    }

    let deposit = 0
    if (policies?.depositRequired) {
      const percentageDeposit = (price * (policies.depositPercentage || 25)) / 100
      deposit = Math.max(percentageDeposit, policies.depositMinimum || 15)
    }

    return {
      totalDuration: duration,
      totalPrice: price,
      depositRequired: deposit,
      petSummaries: summaries,
    }
  }, [selectedPets, services, clientPets, policies])

  // Calculate tip amount
  const tipAmount = useMemo(() => {
    switch (selectedTip) {
      case 'none':
        return 0
      case '5':
        return Math.round(totalPrice * 0.05 * 100) / 100
      case '10':
        return Math.round(totalPrice * 0.1 * 100) / 100
      case '15':
        return Math.round(totalPrice * 0.15 * 100) / 100
      case 'custom':
        return customTipAmount
      default:
        return 0
    }
  }, [selectedTip, customTipAmount, totalPrice])

  // Guard: redirect if no time slot selected (must be after all hooks)
  if (!ctxBookingState.selectedTimeSlot) {
    return <Navigate to={`/book/${orgSlug}/start`} replace />
  }

  const grandTotal = totalPrice + tipAmount

  const startTime = parseISO(`${date}T${time}`)
  const endTime = addMinutes(startTime, totalDuration)

  // Handle adding a new card (from PaymentMethodSelector)
  const handleAddNewCard = (cardValue: CardInputValue, saveForFuture: boolean) => {
    setNewCardValue(cardValue)
    setSaveNewCard(saveForFuture)
    setSelectedPaymentMethodId(null) // Clear any selected saved method
    if (paymentStatus === 'failed') setPaymentStatus('pending')
  }

  // Handle selecting a payment method
  const handlePaymentMethodSelect = (id: string | null) => {
    setSelectedPaymentMethodId(id)
    if (id) {
      // Clear new card data when selecting a saved method
      setNewCardValue(null)
      setSaveNewCard(false)
    }
    if (paymentStatus === 'failed') setPaymentStatus('pending')
  }

  const handlePayment = async () => {
    // Start payment processing
    setPaymentStatus('processing')

    // Simulate payment processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // If adding a new card and "save for future" is checked, save the card
    if (newCardValue && saveNewCard && clientId) {
      try {
        await addPaymentMethod.mutateAsync({
          clientId,
          cardDetails: {
            number: newCardValue.number,
            expiry: newCardValue.expiry,
            cvc: newCardValue.cvc,
          },
        })
      } catch {
        // Card save failed, but we can still process the payment
        console.warn('Failed to save card for future use')
      }
    }

    // Payment successful
    setPaymentStatus('completed')

    // Create booking with payment info
    const bookingState: BookingState = {
      organizationId: organization.id,
      clientId: clientId || undefined,
      isNewClient,
      clientInfo,
      selectedPets: selectedPets.map((pet) => ({
        petId: pet.petId,
        isNewPet: pet.isNewPet,
        petInfo: pet.petInfo as BookingState['selectedPets'][0]['petInfo'],
        services: pet.services,
      })),
      selectedTimeSlot: {
        date,
        startTime: time,
        endTime: format(endTime, 'h:mm a'),
      },
      selectedGroomerId: groomerId,
      notes,
      payment: {
        tipAmount,
        tipOption: selectedTip,
        paymentStatus: 'completed',
        paymentMethod: 'card',
        paidAt: new Date().toISOString(),
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    }

    try {
      const result = await createBooking.mutateAsync(bookingState)
      updateBookingState({ notes })

      // Send booking confirmation email to client (fire-and-forget)
      const clientName = isNewClient
        ? `${clientInfo?.firstName || ''} ${clientInfo?.lastName || ''}`.trim()
        : result.client?.firstName
          ? `${result.client.firstName} ${result.client.lastName}`
          : 'Client'

      const petNamesList = petSummaries.map((p) => p.name).join(', ')

      // Send booking confirmation email to client
      emailApi.sendBookingConfirmationEmail({
        bookingId: result.appointment.id,
        clientName,
        petNames: petNamesList,
        date: format(startTime, 'EEEE, MMMM d, yyyy'),
        time: format(startTime, 'h:mm a'),
        groomerName: selectedGroomer
          ? `${selectedGroomer.firstName} ${selectedGroomer.lastName}`
          : undefined,
        totalAmount: formatCurrency(grandTotal),
        businessName: organization.name,
        isRequested: result.requiresConfirmation,
        senderName: organization.name,
      }).catch(() => {})

      // Send new booking alert to the assigned groomer
      if (selectedGroomer) {
        emailApi.sendNewBookingAlertEmail({
          bookingId: result.appointment.id,
          groomerName: `${selectedGroomer.firstName} ${selectedGroomer.lastName}`,
          clientName,
          petNames: petNamesList,
          date: format(startTime, 'EEEE, MMMM d, yyyy'),
          time: format(startTime, 'h:mm a'),
          isNewClient: result.isNewClient,
          businessName: organization.name,
          senderName: organization.name,
        }).catch(() => {})
      }

      navigate(`/book/${organization.slug}/success?appointmentId=${result.appointment.id}`)
    } catch {
      setPaymentStatus('failed')
    }
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/times`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Confirm Your Appointment</h1>
        <p className="mt-2 text-gray-600">
          Please review your appointment details before confirming.
        </p>
      </div>

      {/* Client Info */}
      {isNewClient && clientInfo && <ClientInfoCard clientInfo={clientInfo} />}

      {/* Appointment Details */}
      <Card>
        <CardTitle>Appointment Details</CardTitle>
        <div className="mt-4 space-y-4">
          <BookingSummaryCard
            startTime={startTime}
            endTime={endTime}
            totalDuration={totalDuration}
          />
          <GroomerInfoCard groomer={selectedGroomer} />
        </div>
      </Card>

      {/* Services Summary */}
      <PetServicesList petSummaries={petSummaries} />

      {/* Notes */}
      <Card>
        <CardTitle>Additional Notes</CardTitle>
        <Textarea
          className="mt-4"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions or notes for us?"
          rows={3}
        />
      </Card>

      {/* Add a Tip */}
      <TipSelector
        selectedTip={selectedTip}
        onTipChange={setSelectedTip}
        customTipAmount={customTipAmount}
        onCustomTipChange={setCustomTipAmount}
        totalPrice={totalPrice}
        tipAmount={tipAmount}
      />

      {/* Pricing Summary */}
      <BookingPriceBreakdown
        totalPrice={totalPrice}
        tipAmount={tipAmount}
        depositRequired={depositRequired}
        grandTotal={grandTotal}
      />

      {/* Payment Section */}
      <PaymentForm
        paymentStatus={paymentStatus}
        clientId={clientId}
        selectedPaymentMethodId={selectedPaymentMethodId}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        onAddNewCard={handleAddNewCard}
      />

      {/* Policies */}
      {policies && (
        <BookingPoliciesCard
          policies={policies}
          agreedToPolicy={agreedToPolicy}
          onAgreedChange={setAgreedToPolicy}
        />
      )}

      {/* New Client Notice */}
      {isNewClient && policies?.newClientMode === 'request_only' && <NewClientNotice />}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={paymentStatus === 'processing'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {paymentStatus !== 'completed' && (
          <Button
            onClick={handlePayment}
            disabled={!agreedToPolicy || paymentStatus === 'processing'}
            className="bg-[#fcd9bd] text-[#1e293b] hover:bg-[#fbc4a0] border-[#1e293b]"
          >
            {paymentStatus === 'processing' ? (
              <>
                <LoadingSpinner size="sm" className="mr-2 text-[#1e293b]" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatCurrency(grandTotal)}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
