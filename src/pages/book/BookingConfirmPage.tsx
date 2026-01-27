import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Card, CardTitle, Button, Textarea, LoadingSpinner } from '@/components/common'
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
} from '@/components/booking'
import type { PetServiceSummary } from '@/components/booking'
import { useActiveServices, usePolicies, useCreateBooking, useClientPets, useGroomers } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO, addMinutes } from 'date-fns'
import type { Organization, BookingState, TipOption, PaymentStatus } from '@/types'

interface SelectedPet {
  petId?: string
  isNewPet: boolean
  petInfo?: {
    name?: string
    species?: string
    breed?: string
    weightRange?: string
    coatType?: string
  }
  services: { serviceId: string; modifierIds: string[] }[]
}

export function BookingConfirmPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()

  const isNewClient = searchParams.get('new') === 'true'
  const clientId = searchParams.get('clientId')
  const petsParam = searchParams.get('pets')
  const date = searchParams.get('date') || ''
  const time = searchParams.get('time') || ''
  const groomerId = searchParams.get('groomerId') || undefined

  const selectedPets: SelectedPet[] = petsParam ? JSON.parse(petsParam) : []

  const clientInfo = isNewClient
    ? {
        firstName: searchParams.get('firstName') || '',
        lastName: searchParams.get('lastName') || '',
        email: searchParams.get('email') || '',
        phone: searchParams.get('phone') || '',
      }
    : undefined

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

  const grandTotal = totalPrice + tipAmount

  const startTime = parseISO(`${date}T${time}`)
  const endTime = addMinutes(startTime, totalDuration)

  const handlePayment = async () => {
    // Start payment processing
    setPaymentStatus('processing')

    // Simulate payment processing delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000))

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
        endTime: format(endTime, 'HH:mm'),
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
      navigate(`/book/${organization.slug}/success?appointmentId=${result.appointment.id}`)
    } catch {
      setPaymentStatus('failed')
    }
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/times?${searchParams.toString()}`)
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
      <PaymentForm paymentStatus={paymentStatus} />

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
