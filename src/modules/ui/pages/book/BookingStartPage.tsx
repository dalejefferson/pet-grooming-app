import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { User, UserPlus, ArrowRight } from 'lucide-react'
import { Card, CardTitle, Button, Input, LoadingPage } from '../../components/common'
import { useSearchClients, useClient } from '@/hooks'
import type { Organization, Client } from '@/types'

export function BookingStartPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()
  const prefilledClientId = searchParams.get('clientId')

  const [isNewClient, setIsNewClient] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newClientInfo, setNewClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const { data: searchResults = [] } = useSearchClients(searchQuery, organization.id)
  const { data: prefilledClient, isLoading: isLoadingPrefilledClient } = useClient(prefilledClientId || '')

  // If clientId is provided in URL, pre-fill the client and skip selection
  useEffect(() => {
    if (prefilledClient && prefilledClientId) {
      setSelectedClient(prefilledClient)
      setIsNewClient(false)
    }
  }, [prefilledClient, prefilledClientId])

  const handleContinue = () => {
    const params = new URLSearchParams()

    if (isNewClient) {
      params.set('new', 'true')
      params.set('firstName', newClientInfo.firstName)
      params.set('lastName', newClientInfo.lastName)
      params.set('email', newClientInfo.email)
      params.set('phone', newClientInfo.phone)
    } else if (selectedClient) {
      params.set('clientId', selectedClient.id)
    }

    navigate(`/book/${organization.slug}/pets?${params.toString()}`)
  }

  const canContinue =
    (isNewClient &&
      newClientInfo.firstName &&
      newClientInfo.lastName &&
      newClientInfo.email &&
      newClientInfo.phone) ||
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
            className={`rounded-lg border-2 p-6 text-left transition-colors ${
              isNewClient === false
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
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
            className={`rounded-lg border-2 p-6 text-left transition-colors ${
              isNewClient === true
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
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
            <Input
              label="Search by name, email, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your name or email..."
            />

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedClient?.id === client.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-gray-600">
                No clients found. Are you sure you've been here before?{' '}
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
                onChange={(e) =>
                  setNewClientInfo((p) => ({ ...p, firstName: e.target.value }))
                }
                required
              />
              <Input
                label="Last Name"
                value={newClientInfo.lastName}
                onChange={(e) =>
                  setNewClientInfo((p) => ({ ...p, lastName: e.target.value }))
                }
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={newClientInfo.email}
              onChange={(e) =>
                setNewClientInfo((p) => ({ ...p, email: e.target.value }))
              }
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={newClientInfo.phone}
              onChange={(e) =>
                setNewClientInfo((p) => ({ ...p, phone: e.target.value }))
              }
              required
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
