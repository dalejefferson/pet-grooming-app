import { useState, useMemo } from 'react'
import { useNavigate, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, User, Users } from 'lucide-react'
import { Card, CardTitle, Button } from '../../components/common'
import { useGroomers } from '@/hooks'
import { useTheme } from '../../context'
import { useBookingContext } from '../../context/BookingContext'
import type { Groomer } from '@/types'
import { cn } from '@/lib/utils'

function GroomerCard({
  groomer,
  isSelected,
  onSelect,
  accentColor,
}: {
  groomer: Groomer | null // null means "Any Available"
  isSelected: boolean
  onSelect: () => void
  accentColor: string
}) {
  const initials = groomer
    ? `${groomer.firstName[0]}${groomer.lastName[0]}`
    : null

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-xl border-3 p-6 text-center transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-[4px_4px_0px_0px_rgba(var(--color-primary-500))]'
          : 'border-[#1e293b] bg-white hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5'
      )}
    >
      {isSelected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
          <Check className="h-4 w-4" />
        </div>
      )}

      {groomer ? (
        <>
          {groomer.imageUrl ? (
            <img
              src={groomer.imageUrl}
              alt={`${groomer.firstName} ${groomer.lastName}`}
              className="h-20 w-20 rounded-full border-3 border-[#1e293b] object-cover"
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1e293b] text-xl font-bold text-[#334155]"
              style={{ backgroundColor: accentColor }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {groomer.firstName} {groomer.lastName}
            </p>
            {groomer.specialties.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {groomer.specialties.map((specialty) => (
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
        </>
      ) : (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
            <Users className="h-10 w-10 text-gray-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Any Available</p>
            <p className="mt-1 text-sm text-gray-500">First available groomer</p>
          </div>
        </>
      )}
    </button>
  )
}

export function BookingGroomerPage() {
  const navigate = useNavigate()
  const { orgSlug } = useParams()
  const { organization, bookingState, updateBookingState } = useBookingContext()
  const { colors } = useTheme()

  // Guard: redirect if no pets selected
  if (!bookingState.selectedPets || bookingState.selectedPets.length === 0) {
    return <Navigate to={`/book/${orgSlug}/start`} replace />
  }

  const { data: allGroomers = [] } = useGroomers()

  // Filter to only active groomers
  const groomers = useMemo(() => allGroomers.filter((g) => g.isActive), [allGroomers])

  // Get selected groomer from context (if returning from later step)
  const [selectedGroomerId, setSelectedGroomerId] = useState<string | undefined>(bookingState.selectedGroomerId)

  const handleSelectGroomer = (groomerId: string | undefined) => {
    setSelectedGroomerId(groomerId)
  }

  const handleContinue = () => {
    updateBookingState({ selectedGroomerId: selectedGroomerId })
    navigate(`/book/${organization.slug}/intake`)
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/pets`)
  }

  // User can proceed if they've selected a groomer OR "Any Available"
  // Since "Any Available" means selectedGroomerId is undefined, we always allow continue
  const canContinue = true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Groomer</h1>
        <p className="mt-2 text-gray-600">
          Select a groomer for your appointment, or choose "Any Available" for the first available slot.
        </p>
      </div>

      {/* Groomer Selection Grid */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary-500" />
          Available Groomers
        </CardTitle>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Any Available option */}
          <GroomerCard
            groomer={null}
            isSelected={selectedGroomerId === undefined}
            onSelect={() => handleSelectGroomer(undefined)}
            accentColor={colors.accentColor}
          />
          {/* Individual groomers */}
          {groomers.map((groomer) => (
            <GroomerCard
              key={groomer.id}
              groomer={groomer}
              isSelected={selectedGroomerId === groomer.id}
              onSelect={() => handleSelectGroomer(groomer.id)}
              accentColor={colors.accentColor}
            />
          ))}
        </div>
      </Card>

      {/* Selected groomer info */}
      {selectedGroomerId && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-primary-600" />
            <div>
              <p className="font-medium text-primary-900">
                Selected: {groomers.find((g) => g.id === selectedGroomerId)?.firstName}{' '}
                {groomers.find((g) => g.id === selectedGroomerId)?.lastName}
              </p>
              <p className="text-sm text-primary-700">
                Services shown in the next step will be based on this groomer's capabilities.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Select Services
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
