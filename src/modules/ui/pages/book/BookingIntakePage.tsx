import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, Button } from '../../components/common'
import { GroomerDisplayCard, ServiceCategorySection, PetProgressTabs } from '../../components/booking'
import { useActiveServices, useClientPets, useGroomers } from '@/hooks'
import {
  SERVICE_CATEGORIES,
  SPECIALTY_TO_SERVICE_CATEGORIES,
  DEFAULT_GROOMER_SERVICE_CATEGORIES,
} from '@/config/constants'
import type { Organization, Service, Groomer } from '@/types'

// Helper function to get service categories a groomer can perform
function getGroomerServiceCategories(groomer: Groomer | null): string[] {
  if (!groomer) {
    return Object.keys(SERVICE_CATEGORIES)
  }

  const categories = new Set<string>()

  for (const specialty of groomer.specialties) {
    const specialtyCategories = SPECIALTY_TO_SERVICE_CATEGORIES[specialty]
    if (specialtyCategories) {
      specialtyCategories.forEach((cat) => categories.add(cat))
    }
  }

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
    ? JSON.parse(petsParam).map((p: SelectedPet) => ({ ...p, services: p.services || [] }))
    : []

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: clientPets = [] } = useClientPets(clientId || '')
  const { data: allGroomers = [] } = useGroomers()

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

  const allowedCategories = useMemo(
    () => getGroomerServiceCategories(selectedGroomer),
    [selectedGroomer]
  )

  const servicesByCategory = useMemo(() => {
    return services.reduce((acc, service) => {
      if (!allowedCategories.includes(service.category)) return acc
      if (!acc[service.category]) acc[service.category] = []
      acc[service.category].push(service)
      return acc
    }, {} as Record<string, Service[]>)
  }, [services, allowedCategories])

  const hasAvailableServices = Object.keys(servicesByCategory).length > 0

  const toggleService = (serviceId: string) => {
    setSelectedPets((prev) => {
      const updated = [...prev]
      const pet = updated[currentPetIndex]
      if (!pet) return prev

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
        <h1 className="text-2xl font-bold text-gray-900">Select Services for {petName}</h1>
        {selectedPets.length > 1 && (
          <p className="mt-2 text-gray-600">Pet {currentPetIndex + 1} of {selectedPets.length}</p>
        )}
      </div>

      <GroomerDisplayCard
        selectedGroomer={selectedGroomer}
        currentPet={currentPet}
        petName={petName}
        services={services}
        organizationSlug={organization.slug}
        searchParams={searchParams}
        onToggleService={toggleService}
      />

      <PetProgressTabs
        selectedPets={selectedPets}
        clientPets={clientPets}
        currentPetIndex={currentPetIndex}
        onSelectPet={setCurrentPetIndex}
      />

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

      {selectedPets.length > 0 && !hasAvailableServices && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">No services available for this groomer</p>
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
            onClick={() => navigate(`/book/${organization.slug}/groomer?${searchParams.toString()}`)}
          >
            Change Groomer
          </Button>
        </Card>
      )}

      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <ServiceCategorySection
          key={category}
          category={category}
          services={categoryServices}
          isServiceSelected={isServiceSelected}
          isModifierSelected={isModifierSelected}
          onToggleService={toggleService}
          onToggleModifier={toggleModifier}
        />
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!currentPetHasServices}>
          {currentPetIndex < selectedPets.length - 1 ? (
            <>Next Pet<ArrowRight className="ml-2 h-4 w-4" /></>
          ) : (
            <>Choose Time<ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  )
}
