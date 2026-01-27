import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Dog, CreditCard, AlertCircle, Check, Lock, Users } from 'lucide-react'
import { Card, CardTitle, Button, Textarea, Input, LoadingSpinner } from '@/components/common'
import { useActiveServices, usePolicies, useCreateBooking, useClientPets, useGroomers } from '@/hooks'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'
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
    const summaries: {
      name: string
      services: { name: string; duration: number; price: number }[]
    }[] = []

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
    } catch (error) {
      console.error('Booking failed:', error)
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
      {isNewClient && clientInfo && (
        <Card>
          <CardTitle>Your Information</CardTitle>
          <div className="mt-4 space-y-2">
            <p className="text-gray-900">
              {clientInfo.firstName} {clientInfo.lastName}
            </p>
            <p className="text-gray-600">{clientInfo.email}</p>
            <p className="text-gray-600">{clientInfo.phone}</p>
          </div>
        </Card>
      )}

      {/* Appointment Details */}
      <Card>
        <CardTitle>Appointment Details</CardTitle>
        <div className="mt-4 space-y-4">
          {/* Time */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {format(startTime, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-gray-600">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {formatDuration(totalDuration)}
              </div>
            </div>
          </div>

          {/* Groomer */}
          <div className="flex items-start gap-4 border-t pt-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-accent-100">
              {selectedGroomer ? (
                selectedGroomer.imageUrl ? (
                  <img
                    src={selectedGroomer.imageUrl}
                    alt={`${selectedGroomer.firstName} ${selectedGroomer.lastName}`}
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-accent-700">
                    {selectedGroomer.firstName[0]}
                    {selectedGroomer.lastName[0]}
                  </span>
                )
              ) : (
                <Users className="h-6 w-6 text-accent-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Groomer</p>
              <p className="font-medium text-gray-900">
                {selectedGroomer
                  ? `${selectedGroomer.firstName} ${selectedGroomer.lastName}`
                  : 'First Available Groomer'}
              </p>
              {selectedGroomer && selectedGroomer.specialties.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedGroomer.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Services Summary */}
      <Card>
        <CardTitle>Services</CardTitle>
        <div className="mt-4 space-y-4">
          {petSummaries.map((pet, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Dog className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">{pet.name}</span>
              </div>
              <div className="space-y-2">
                {pet.services.map((service, sIndex) => (
                  <div key={sIndex} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {service.name} ({formatDuration(service.duration)})
                    </span>
                    <span className="text-gray-900">{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

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
      <Card>
        <CardTitle>Add a Tip</CardTitle>
        <p className="mt-1 text-sm text-gray-500">Show appreciation for our groomers</p>
        <div className="mt-4">
          {/* Tip toggle buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'none' as TipOption, label: 'No Tip' },
              { value: '5' as TipOption, label: '5%' },
              { value: '10' as TipOption, label: '10%' },
              { value: '15' as TipOption, label: '15%' },
              { value: 'custom' as TipOption, label: 'Custom' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedTip(option.value)}
                className={cn(
                  'rounded-xl border-2 border-[#1e293b] px-4 py-2 text-sm font-semibold transition-all duration-150',
                  selectedTip === option.value
                    ? 'bg-[#fcd9bd] shadow-[2px_2px_0px_0px_#1e293b] -translate-y-0.5'
                    : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_#1e293b] hover:-translate-y-0.5'
                )}
              >
                {option.label}
                {option.value !== 'none' &&
                  option.value !== 'custom' &&
                  ` (${formatCurrency(totalPrice * (parseInt(option.value) / 100))})`}
              </button>
            ))}
          </div>

          {/* Custom tip input */}
          {selectedTip === 'custom' && (
            <div className="mt-4">
              <Input
                type="number"
                label="Custom Tip Amount"
                placeholder="Enter amount"
                min={0}
                step={0.01}
                value={customTipAmount || ''}
                onChange={(e) => setCustomTipAmount(parseFloat(e.target.value) || 0)}
                className="max-w-[200px]"
              />
            </div>
          )}

          {/* Selected tip display */}
          {tipAmount > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success-600" />
              <span className="text-gray-600">
                Tip: <span className="font-semibold text-gray-900">{formatCurrency(tipAmount)}</span>
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardTitle>Pricing Summary</CardTitle>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal (Services)</span>
            <span className="text-gray-900">{formatCurrency(totalPrice)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tip</span>
              <span className="text-gray-900">{formatCurrency(tipAmount)}</span>
            </div>
          )}
          {depositRequired > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Deposit Required</span>
              <span className="text-warning-600">{formatCurrency(depositRequired)}</span>
            </div>
          )}
          <div className="border-t-2 border-[#1e293b] pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-[#1e293b]">Total</span>
              <span className="text-[#1e293b]">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Section */}
      <Card className="border-[#1e293b] bg-white">
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Payment
        </CardTitle>
        <p className="mt-1 text-sm text-gray-500">Secure payment processing</p>

        {paymentStatus === 'completed' ? (
          <div className="mt-4 rounded-xl border-2 border-success-500 bg-success-50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-success-900">Payment Successful!</p>
                <p className="text-sm text-success-700">Your booking is being confirmed...</p>
              </div>
            </div>
          </div>
        ) : paymentStatus === 'failed' ? (
          <div className="mt-4 rounded-xl border-2 border-danger-500 bg-danger-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-danger-600" />
              <div>
                <p className="font-semibold text-danger-900">Payment Failed</p>
                <p className="text-sm text-danger-700">Please try again or use a different card.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Mock Card Display */}
            <div className="rounded-xl border-2 border-[#1e293b] bg-gradient-to-br from-[#1e293b] to-[#334155] p-4 text-white shadow-[3px_3px_0px_0px_#64748b]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                  Credit Card
                </span>
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="mt-4 font-mono text-lg tracking-wider">4242 4242 4242 4242</div>
              <div className="mt-3 flex justify-between text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider opacity-60">Expiry</span>
                  <p className="font-mono">12/25</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider opacity-60">CVC</span>
                  <p className="font-mono">123</p>
                </div>
              </div>
            </div>

            {/* Mock card inputs (read-only display) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
                  Card Number
                </label>
                <div className="rounded-xl border-2 border-[#1e293b] bg-gray-100 px-3 py-2 text-gray-600">
                  4242 4242 4242 4242
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1e293b]">Expiry</label>
                <div className="rounded-xl border-2 border-[#1e293b] bg-gray-100 px-3 py-2 text-gray-600">
                  12/25
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1e293b]">CVC</label>
                <div className="rounded-xl border-2 border-[#1e293b] bg-gray-100 px-3 py-2 text-gray-600">
                  123
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Policies */}
      {policies && (
        <Card className="border-warning-200 bg-warning-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-warning-600" />
            <div className="flex-1">
              <h3 className="font-medium text-warning-900">Booking Policies</h3>
              <p className="mt-2 text-sm text-warning-800">{policies.policyText}</p>
              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-warning-900">
                  I agree to the booking policies
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* New Client Notice */}
      {isNewClient && policies?.newClientMode === 'request_only' && (
        <Card className="border-primary-200 bg-primary-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-primary-600" />
            <div>
              <h3 className="font-medium text-primary-900">New Client Booking</h3>
              <p className="mt-1 text-sm text-primary-800">
                As a new client, your booking will be submitted as a request. We'll contact you
                to confirm your appointment within 24 hours.
              </p>
            </div>
          </div>
        </Card>
      )}

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
