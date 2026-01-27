import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Card, CardTitle, Button, Badge } from '@/components/common'
import { useActiveServices, useClientPets } from '@/hooks'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { SERVICE_CATEGORIES } from '@/config/constants'
import type { Organization, Service } from '@/types'

interface SelectedPet {
  petId?: string
  isNewPet: boolean
  petInfo?: {
    name?: string
    breed?: string
    weightRange?: string
    coatType?: string
  }
  services: { serviceId: string; modifierIds: string[] }[]
}

export function BookingIntakePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()

  const clientId = searchParams.get('clientId')
  const petsParam = searchParams.get('pets')
  const initialPets: SelectedPet[] = petsParam
    ? JSON.parse(petsParam).map((p: SelectedPet) => ({
        ...p,
        services: p.services || [],
      }))
    : []

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: clientPets = [] } = useClientPets(clientId || '')

  const [selectedPets, setSelectedPets] = useState<SelectedPet[]>(initialPets)
  const [currentPetIndex, setCurrentPetIndex] = useState(0)

  const currentPet = selectedPets[currentPetIndex]
  const petName = currentPet?.isNewPet
    ? currentPet.petInfo?.name
    : clientPets.find((p) => p.id === currentPet?.petId)?.name

  const servicesByCategory = useMemo(() => {
    return services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {} as Record<string, Service[]>)
  }, [services])

  const toggleService = (serviceId: string) => {
    setSelectedPets((prev) => {
      const updated = [...prev]
      const pet = updated[currentPetIndex]
      const existingIndex = pet.services.findIndex((s) => s.serviceId === serviceId)

      if (existingIndex >= 0) {
        pet.services = pet.services.filter((s) => s.serviceId !== serviceId)
      } else {
        pet.services = [...pet.services, { serviceId, modifierIds: [] }]
      }

      return updated
    })
  }

  const toggleModifier = (serviceId: string, modifierId: string) => {
    setSelectedPets((prev) => {
      const updated = [...prev]
      const pet = updated[currentPetIndex]
      const serviceIndex = pet.services.findIndex((s) => s.serviceId === serviceId)

      if (serviceIndex >= 0) {
        const service = pet.services[serviceIndex]
        const modifierIndex = service.modifierIds.indexOf(modifierId)

        if (modifierIndex >= 0) {
          service.modifierIds = service.modifierIds.filter((id) => id !== modifierId)
        } else {
          service.modifierIds = [...service.modifierIds, modifierId]
        }
      }

      return updated
    })
  }

  const isServiceSelected = (serviceId: string) => {
    return currentPet?.services.some((s) => s.serviceId === serviceId)
  }

  const isModifierSelected = (serviceId: string, modifierId: string) => {
    const service = currentPet?.services.find((s) => s.serviceId === serviceId)
    return service?.modifierIds.includes(modifierId) || false
  }

  const handleContinue = () => {
    if (currentPetIndex < selectedPets.length - 1) {
      setCurrentPetIndex((prev) => prev + 1)
    } else {
      const params = new URLSearchParams(searchParams)
      params.set('pets', JSON.stringify(selectedPets))
      navigate(`/book/${organization.slug}/times?${params.toString()}`)
    }
  }

  const handleBack = () => {
    if (currentPetIndex > 0) {
      setCurrentPetIndex((prev) => prev - 1)
    } else {
      navigate(`/book/${organization.slug}/pets?${searchParams.toString()}`)
    }
  }

  const currentPetHasServices = currentPet?.services.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Select Services for {petName}
        </h1>
        {selectedPets.length > 1 && (
          <p className="mt-2 text-gray-600">
            Pet {currentPetIndex + 1} of {selectedPets.length}
          </p>
        )}
      </div>

      {/* Pet Progress */}
      {selectedPets.length > 1 && (
        <div className="flex gap-2">
          {selectedPets.map((pet, index) => {
            const name = pet.isNewPet
              ? pet.petInfo?.name
              : clientPets.find((p) => p.id === pet.petId)?.name
            return (
              <button
                key={index}
                onClick={() => setCurrentPetIndex(index)}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  index === currentPetIndex
                    ? 'bg-primary-500 text-white'
                    : pet.services.length > 0
                    ? 'bg-success-100 text-success-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {name}
                {pet.services.length > 0 && index !== currentPetIndex && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Services by Category */}
      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <Card key={category}>
          <CardTitle>{SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]}</CardTitle>
          <div className="mt-4 space-y-4">
            {categoryServices.map((service) => {
              const isSelected = isServiceSelected(service.id)
              return (
                <div key={service.id}>
                  <button
                    onClick={() => toggleService(service.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline" size="sm">
                          {formatDuration(service.baseDurationMinutes)}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {formatCurrency(service.basePrice)}
                        </Badge>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Modifiers */}
                  {isSelected && service.modifiers.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {service.modifiers.map((modifier) => (
                        <button
                          key={modifier.id}
                          onClick={() => toggleModifier(service.id, modifier.id)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            isModifierSelected(service.id, modifier.id)
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <span className="font-medium text-gray-900">{modifier.name}</span>
                            <span className="ml-2 text-gray-600">
                              +{formatDuration(modifier.durationMinutes)}, +
                              {modifier.isPercentage
                                ? `${modifier.priceAdjustment}%`
                                : formatCurrency(modifier.priceAdjustment)}
                            </span>
                          </div>
                          {isModifierSelected(service.id, modifier.id) && (
                            <Check className="h-4 w-4 text-primary-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!currentPetHasServices}>
          {currentPetIndex < selectedPets.length - 1 ? (
            <>
              Next Pet
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Choose Time
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
