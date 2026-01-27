import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/components/common'
import { formatCurrency } from '@/lib/utils'
import type { Groomer, Service } from '@/types'

interface SelectedService {
  serviceId: string
  modifierIds: string[]
}

interface SelectedPet {
  petId?: string
  isNewPet: boolean
  petInfo?: {
    name?: string
    breed?: string
    weightRange?: string
    coatType?: string
  }
  services: SelectedService[]
}

interface GroomerDisplayCardProps {
  selectedGroomer: Groomer | null
  currentPet: SelectedPet | undefined
  petName: string | undefined
  services: Service[]
  organizationSlug: string
  searchParams: URLSearchParams
  onToggleService: (serviceId: string) => void
}

export function GroomerDisplayCard({
  selectedGroomer,
  currentPet,
  petName,
  services,
  organizationSlug,
  searchParams,
  onToggleService,
}: GroomerDisplayCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="bg-accent-50 border-accent-200">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-accent-100">
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
        <div className="flex-1">
          <p className="text-sm text-accent-600">Your Groomer</p>
          <p className="font-semibold text-accent-900">
            {selectedGroomer
              ? `${selectedGroomer.firstName} ${selectedGroomer.lastName}`
              : 'Any Available Groomer'}
          </p>
          {selectedGroomer && selectedGroomer.specialties.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {selectedGroomer.specialties.map((specialty) => (
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/book/${organizationSlug}/groomer?${searchParams.toString()}`)}
        >
          Change
        </Button>
      </div>

      {/* Selected Services Queue */}
      {currentPet && currentPet.services.length > 0 && (
        <div className="mt-4 border-t border-accent-200 pt-4">
          <p className="text-xs font-semibold text-accent-600 uppercase tracking-wide mb-2">
            Selected Services for {petName}
          </p>
          <div className="flex flex-wrap gap-2">
            {currentPet.services.map((selected) => {
              const service = services.find((s) => s.id === selected.serviceId)
              if (!service) return null
              return (
                <div
                  key={selected.serviceId}
                  className="flex items-center gap-2 rounded-lg border-2 border-[#1e293b] bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#1e293b]"
                >
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  <span className="text-sm font-bold text-primary-600">{formatCurrency(service.basePrice)}</span>
                  <button
                    onClick={() => onToggleService(service.id)}
                    className="ml-1 text-gray-400 hover:text-danger-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-right text-sm font-semibold text-accent-900">
            Total: {formatCurrency(
              currentPet.services.reduce((total, selected) => {
                const service = services.find((s) => s.id === selected.serviceId)
                return total + (service?.basePrice || 0)
              }, 0)
            )}
          </p>
        </div>
      )}
    </Card>
  )
}
