import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, Users, AlertCircle } from 'lucide-react'
import { Card, CardTitle, Button, Badge } from '@/components/common'
import { useActiveServices, useClientPets, useGroomers } from '@/hooks'
import { formatCurrency, formatDuration } from '@/lib/utils'
import {
  SERVICE_CATEGORIES,
  SPECIALTY_TO_SERVICE_CATEGORIES,
  DEFAULT_GROOMER_SERVICE_CATEGORIES,
} from '@/config/constants'
import type { Organization, Service, Groomer } from '@/types'

// Helper function to get service categories a groomer can perform
function getGroomerServiceCategories(groomer: Groomer | null): string[] {
  // If no specific groomer selected (Any Available), allow all categories
  if (!groomer) {
    return Object.keys(SERVICE_CATEGORIES)
  }

  // Collect all service categories from the groomer's specialties
  const categories = new Set<string>()

  // Add categories based on specialties
  for (const specialty of groomer.specialties) {
    const specialtyCategories = SPECIALTY_TO_SERVICE_CATEGORIES[specialty]
    if (specialtyCategories) {
      specialtyCategories.forEach((cat) => categories.add(cat))
    }
  }

  // If groomer has no mapped specialties, use default categories
  if (categories.size === 0) {
    DEFAULT_GROOMER_SERVICE_CATEGORIES.forEach((cat) => categories.add(cat))
  }

  return Array.from(categories)
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
  services: { serviceId: string; modifierIds: string[] }[]
}

export function BookingIntakePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()

  const clientId = searchParams.get('clientId')
  const petsParam = searchParams.get('pets')
  const groomerId = searchParams.get('groomerId') || undefined
  const initialPets: SelectedPet[] = petsParam
    ? JSON.parse(petsParam).map((p: SelectedPet) => ({
        ...p,
        services: p.services || [],
      }))
    : []

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: clientPets = [] } = useClientPets(clientId || '')
  const { data: allGroomers = [] } = useGroomers()

  // Find the selected groomer
  const selectedGroomer = useMemo(() => {
    if (!groomerId) return null
    return allGroomers.find((g) => g.id === groomerId) || null
  }, [groomerId, allGroomers])

  const [selectedPets, setSelectedPets] = useState<SelectedPet[]>(initialPets)
  const [currentPetIndex, setCurrentPetIndex] = useState(0)

  const currentPet = selectedPets[currentPetIndex]
  const petName = currentPet?.isNewPet
    ? currentPet.petInfo?.name
    : clientPets.find((p) => p.id === currentPet?.petId)?.name

  // Get allowed service categories for the selected groomer
  const allowedCategories = useMemo(
    () => getGroomerServiceCategories(selectedGroomer),
    [selectedGroomer]
  )

  // Filter services by groomer capabilities and group by category
  const servicesByCategory = useMemo(() => {
    return services.reduce((acc, service) => {
      // Only include services that the groomer can perform
      if (!allowedCategories.includes(service.category)) {
        return acc
      }
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    }, {} as Record<string, Service[]>)
  }, [services, allowedCategories])

  // Check if any services are available for this groomer
  const hasAvailableServices = Object.keys(servicesByCategory).length > 0

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
      navigate(`/book/${organization.slug}/groomer?${searchParams.toString()}`)
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

      {/* Selected Groomer Display */}
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
            onClick={() => navigate(`/book/${organization.slug}/groomer?${searchParams.toString()}`)}
          >
            Change
          </Button>
        </div>
      </Card>

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

      {/* No pets selected warning */}
      {selectedPets.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">No pets selected</p>
              <p className="text-sm text-yellow-700">
                Please go back and select at least one pet to continue.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* No services available for groomer warning */}
      {selectedPets.length > 0 && !hasAvailableServices && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                No services available for this groomer
              </p>
              <p className="text-sm text-yellow-700">
                {selectedGroomer
                  ? `${selectedGroomer.firstName} ${selectedGroomer.lastName} doesn't have services matching their specialties. Please choose a different groomer or select "Any Available".`
                  : 'No services are currently available. Please try again later.'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              navigate(`/book/${organization.slug}/groomer?${searchParams.toString()}`)
            }
          >
            Change Groomer
          </Button>
        </Card>
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
