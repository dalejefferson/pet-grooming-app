import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, UserPlus, ArrowRight } from 'lucide-react'
import { Card, CardTitle, Button, Input, LoadingPage, AddressAutocomplete } from '../../components/common'
import { useClientForBooking } from '@/hooks'
import { useBookingContext } from '../../context/BookingContext'
import { clientsApi } from '@/modules/database/api'
import type { Client } from '@/types'

export function BookingStartPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization, updateBookingState } = useBookingContext()
  const prefilledClientId = searchParams.get('clientId')

  const [isNewClient, setIsNewClient] = useState<boolean | null>(null)
  const [emailLookup, setEmailLookup] = useState('')
  const [lookupResult, setLookupResult] = useState<Client | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newClientInfo, setNewClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  })
  const [validationErrors, setValidationErrors] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string }>({})

  const { data: prefilledClient, isLoading: isLoadingPrefilledClient } = useClientForBooking(prefilledClientId || '', organization?.id || '')

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleEmailLookup = async () => {
    if (!isValidEmail(emailLookup)) {
      setLookupError('Please enter a valid email address')
      return
    }
    setIsSearching(true)
    setLookupError(null)
    setLookupResult(null)
    setHasSearched(true)
    try {
      const results = await clientsApi.search(emailLookup, organization.id)
      // Only match exact email (case-insensitive)
      const match = results.find(
        (c) => c.email?.toLowerCase() === emailLookup.toLowerCase().trim()
      )
      if (match) {
        setLookupResult(match)
      }
    } catch {
      setLookupError('Something went wrong. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // If clientId is provided in URL, pre-fill the client and skip selection
  useEffect(() => {
    if (prefilledClient && prefilledClientId && selectedClient?.id !== prefilledClient.id) {
      setSelectedClient(prefilledClient)
      setIsNewClient(false)
    }
  }, [prefilledClient, prefilledClientId, selectedClient?.id])

  const handleContinue = () => {
    if (isNewClient && !validateFields()) return
    if (isNewClient) {
      updateBookingState({
        isNewClient: true,
        clientInfo: {
          firstName: newClientInfo.firstName,
          lastName: newClientInfo.lastName,
          email: newClientInfo.email,
          phone: newClientInfo.phone,
          address: newClientInfo.address || undefined,
        },
        clientId: undefined,
      })
    } else if (selectedClient) {
      updateBookingState({
        isNewClient: false,
        clientId: selectedClient.id,
        clientInfo: undefined,
      })
    }

    navigate(`/book/${organization.slug}/pets`)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/

  const validateFields = () => {
    const errors: { firstName?: string; lastName?: string; email?: string; phone?: string } = {}
    if (!newClientInfo.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!newClientInfo.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (newClientInfo.email && !emailRegex.test(newClientInfo.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (newClientInfo.phone && !phoneRegex.test(newClientInfo.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isEmailValid = !newClientInfo.email || emailRegex.test(newClientInfo.email)
  const isPhoneValid = !newClientInfo.phone || phoneRegex.test(newClientInfo.phone)

  const canContinue =
    (isNewClient &&
      newClientInfo.firstName &&
      newClientInfo.lastName &&
      newClientInfo.email &&
      newClientInfo.phone &&
      isEmailValid &&
      isPhoneValid) ||
    (!isNewClient && selectedClient)

  // Show loading state when fetching prefilled client
  if (prefilledClientId && isLoadingPrefilledClient) {
    return <LoadingPage />
  }

  // If client is pre-filled from URL, show confirmation and skip selection
  const isClientPrefilled = prefilledClientId && selectedClient

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="mt-2 text-gray-600">
          {isClientPrefilled
            ? 'Confirm your information and continue'
            : 'Are you a new or returning client?'}
        </p>
      </div>

      {/* Show client confirmation when pre-filled */}
      {isClientPrefilled && (
        <Card>
          <CardTitle>Welcome back!</CardTitle>
          <div className="mt-4">
            <div className="rounded-lg border-2 border-primary-500 bg-primary-50 p-4">
              <p className="font-medium text-gray-900">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedClient.email}</p>
              {selectedClient.phone && (
                <p className="text-sm text-gray-600">{selectedClient.phone}</p>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Not you?{' '}
              <button
                onClick={() => {
                  setSelectedClient(null)
                  setIsNewClient(null)
                  // Navigate to the page without the clientId param
                  navigate(`/book/${organization.slug}/start`, { replace: true })
                }}
                className="text-primary-600 hover:underline"
              >
                Search for a different account
              </button>
            </p>
          </div>
        </Card>
      )}

      {/* Show new/returning selection only when not pre-filled */}
      {!isClientPrefilled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setIsNewClient(false)}
            className={`rounded-xl border-2 p-6 text-left transition-all ${
              isNewClient === false
                ? 'border-primary-500 bg-primary-50 shadow-[3px_3px_0px_0px_#1e293b]'
                : 'border-[#1e293b] hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5'
            }`}
          >
            <User className="h-8 w-8 text-primary-600" />
            <h3 className="mt-3 font-semibold text-gray-900">Returning Client</h3>
            <p className="mt-1 text-sm text-gray-600">
              I've been here before
            </p>
          </button>

          <button
            onClick={() => setIsNewClient(true)}
            className={`rounded-xl border-2 p-6 text-left transition-all ${
              isNewClient === true
                ? 'border-primary-500 bg-primary-50 shadow-[3px_3px_0px_0px_#1e293b]'
                : 'border-[#1e293b] hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5'
            }`}
          >
            <UserPlus className="h-8 w-8 text-primary-600" />
            <h3 className="mt-3 font-semibold text-gray-900">New Client</h3>
            <p className="mt-1 text-sm text-gray-600">
              This is my first visit
            </p>
          </button>
        </div>
      )}

      {isNewClient === false && !isClientPrefilled && (
        <Card>
          <CardTitle>Find Your Account</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <Input
                label="Enter your email to find your account"
                type="email"
                value={emailLookup}
                onChange={(e) => {
                  setEmailLookup(e.target.value)
                  setLookupError(null)
                  setHasSearched(false)
                  setLookupResult(null)
                  setSelectedClient(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidEmail(emailLookup)) {
                    handleEmailLookup()
                  }
                }}
                placeholder="your@email.com"
                error={lookupError || undefined}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleEmailLookup}
                disabled={!isValidEmail(emailLookup) || isSearching}
              >
                {isSearching ? 'Looking up...' : 'Look Up'}
              </Button>
            </div>

            {lookupResult && (
              <button
                onClick={() => setSelectedClient(lookupResult)}
                className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                  selectedClient?.id === lookupResult.id
                    ? 'border-primary-500 bg-primary-50 shadow-[2px_2px_0px_0px_#1e293b]'
                    : 'border-[#1e293b] hover:shadow-[2px_2px_0px_0px_#1e293b] hover:-translate-y-0.5'
                }`}
              >
                <p className="font-medium text-gray-900">
                  {lookupResult.firstName} {lookupResult.lastName}
                </p>
                <p className="text-sm text-gray-600">{lookupResult.email}</p>
              </button>
            )}

            {hasSearched && !isSearching && !lookupResult && !lookupError && (
              <p className="text-sm text-gray-600">
                No account found with that email. Are you sure you've been here before?{' '}
                <button
                  onClick={() => setIsNewClient(true)}
                  className="text-primary-600 hover:underline"
                >
                  Register as a new client
                </button>
              </p>
            )}
          </div>
        </Card>
      )}

      {isNewClient === true && (
        <Card>
          <CardTitle>Your Information</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={newClientInfo.firstName}
                onChange={(e) => {
                  setNewClientInfo((p) => ({ ...p, firstName: e.target.value }))
                  if (validationErrors.firstName) setValidationErrors((p) => ({ ...p, firstName: undefined }))
                }}
                onBlur={() => {
                  if (!newClientInfo.firstName.trim()) {
                    setValidationErrors((p) => ({ ...p, firstName: 'First name is required' }))
                  }
                }}
                error={validationErrors.firstName}
                required
              />
              <Input
                label="Last Name"
                value={newClientInfo.lastName}
                onChange={(e) => {
                  setNewClientInfo((p) => ({ ...p, lastName: e.target.value }))
                  if (validationErrors.lastName) setValidationErrors((p) => ({ ...p, lastName: undefined }))
                }}
                onBlur={() => {
                  if (!newClientInfo.lastName.trim()) {
                    setValidationErrors((p) => ({ ...p, lastName: 'Last name is required' }))
                  }
                }}
                error={validationErrors.lastName}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={newClientInfo.email}
              onChange={(e) => {
                setNewClientInfo((p) => ({ ...p, email: e.target.value }))
                if (validationErrors.email) setValidationErrors((p) => ({ ...p, email: undefined }))
              }}
              error={validationErrors.email || (!isEmailValid && newClientInfo.email ? 'Please enter a valid email address' : undefined)}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={newClientInfo.phone}
              onChange={(e) => {
                setNewClientInfo((p) => ({ ...p, phone: e.target.value }))
                if (validationErrors.phone) setValidationErrors((p) => ({ ...p, phone: undefined }))
              }}
              error={validationErrors.phone || (!isPhoneValid && newClientInfo.phone ? 'Please enter a valid phone number' : undefined)}
              required
            />
            <AddressAutocomplete
              label="Address"
              value={newClientInfo.address}
              onChange={(val) => setNewClientInfo((p) => ({ ...p, address: val }))}
              helperText="Optional"
            />
          </div>
        </Card>
      )}

      {(isNewClient !== null || isClientPrefilled) && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} disabled={!canContinue}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
