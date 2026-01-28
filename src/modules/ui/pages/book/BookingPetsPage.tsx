import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { Plus, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react'
import { Card, CardTitle, Button, Input, Select, ComboBox } from '../../components/common'
import { VaccinationStatusBadge, ExpiredVaccinationWarning } from '../../components/booking'
import { useClientPets } from '@/hooks'
import { COAT_TYPE_LABELS, WEIGHT_RANGE_LABELS, DOG_BREEDS, CAT_BREEDS } from '@/config/constants'
import {
  getPetVaccinationStatus,
  getExpiredVaccinations,
} from '@/lib/utils/vaccinationUtils'
import type { Organization, Pet } from '@/types'

interface SelectedPet {
  petId?: string
  isNewPet: boolean
  petInfo?: Partial<Pet>
}

export function BookingPetsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()

  const isNewClient = searchParams.get('new') === 'true'
  const clientId = searchParams.get('clientId')

  const { data: existingPets = [] } = useClientPets(clientId || '')

  const [selectedPets, setSelectedPets] = useState<SelectedPet[]>([])
  const [showNewPetForm, setShowNewPetForm] = useState(isNewClient)
  const [newPetInfo, setNewPetInfo] = useState<Partial<Pet>>({
    name: '',
    species: 'dog',
    breed: '',
    weightRange: 'medium',
    coatType: 'medium',
  })

  // Get breed options based on selected species
  const breedOptions = useMemo(() => {
    if (newPetInfo.species === 'dog') {
      return DOG_BREEDS.map(breed => ({ value: breed, label: breed }))
    } else if (newPetInfo.species === 'cat') {
      return CAT_BREEDS.map(breed => ({ value: breed, label: breed }))
    }
    return []
  }, [newPetInfo.species])

  const togglePet = (pet: Pet) => {
    // Don't allow selection of pets with expired vaccinations
    const vaccinationStatus = getPetVaccinationStatus(pet)
    if (vaccinationStatus === 'expired') {
      return
    }

    setSelectedPets((prev) => {
      const exists = prev.find((p) => p.petId === pet.id)
      if (exists) {
        return prev.filter((p) => p.petId !== pet.id)
      }
      return [...prev, { petId: pet.id, isNewPet: false }]
    })
  }

  const addNewPet = () => {
    if (!newPetInfo.name || !newPetInfo.breed) return

    setSelectedPets((prev) => [
      ...prev,
      { isNewPet: true, petInfo: { ...newPetInfo } },
    ])
    setNewPetInfo({
      name: '',
      species: 'dog',
      breed: '',
      weightRange: 'medium',
      coatType: 'medium',
    })
    setShowNewPetForm(false)
  }

  const removeNewPet = (index: number) => {
    setSelectedPets((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    const params = new URLSearchParams(searchParams)
    params.set('pets', JSON.stringify(selectedPets))
    navigate(`/book/${organization.slug}/groomer?${params.toString()}`)
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/start`)
  }

  // Check if any existing pets have expired vaccinations
  const petsWithExpiredVaccinations = useMemo(() => {
    return existingPets.filter(
      (pet) => getPetVaccinationStatus(pet) === 'expired'
    )
  }, [existingPets])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Select Your Pets</h1>
        <p className="mt-2 text-gray-600">
          Which pets would you like to bring in for grooming?
        </p>
      </div>

      {/* Vaccination Warning Notice */}
      {petsWithExpiredVaccinations.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-amber-50 px-4 py-3 shadow-[2px_2px_0px_0px_#1e293b]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Pets with expired vaccinations cannot be booked. Please update vaccination records before scheduling an appointment.
          </p>
        </div>
      )}

      {/* Existing Pets */}
      {!isNewClient && existingPets.length > 0 && (
        <Card>
          <CardTitle>Your Pets</CardTitle>
          <div className="mt-4 space-y-3">
            {existingPets.map((pet) => {
              const isSelected = selectedPets.some((p) => p.petId === pet.id)
              const vaccinationStatus = getPetVaccinationStatus(pet)
              const isExpired = vaccinationStatus === 'expired'
              const expiredVaccinations = isExpired ? getExpiredVaccinations(pet) : []

              return (
                <div key={pet.id} className="space-y-2">
                  <button
                    onClick={() => togglePet(pet)}
                    disabled={isExpired}
                    className={`flex w-full items-center justify-between rounded-xl border-2 border-[#1e293b] p-4 text-left transition-all ${
                      isExpired
                        ? 'cursor-not-allowed bg-gray-100 opacity-60'
                        : isSelected
                          ? 'bg-primary-50 shadow-[3px_3px_0px_0px_#1e293b] -translate-y-0.5'
                          : 'bg-white shadow-[2px_2px_0px_0px_#1e293b] hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${isExpired ? 'text-gray-500' : 'text-[#1e293b]'}`}>
                          {pet.name}
                        </p>
                        {pet.vaccinations && pet.vaccinations.length > 0 && (
                          <VaccinationStatusBadge status={vaccinationStatus} size="sm" />
                        )}
                      </div>
                      <p className={`text-sm ${isExpired ? 'text-gray-400' : 'text-[#64748b]'}`}>
                        {pet.breed} - {COAT_TYPE_LABELS[pet.coatType]}
                      </p>
                    </div>
                    {isSelected && !isExpired && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] bg-primary-500 shadow-[1px_1px_0px_0px_#1e293b]">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Show expired vaccination warning below the pet card */}
                  {isExpired && expiredVaccinations.length > 0 && (
                    <ExpiredVaccinationWarning
                      petName={pet.name}
                      petId={pet.id}
                      expiredVaccinations={expiredVaccinations}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* New Pets Added */}
      {selectedPets.filter((p) => p.isNewPet).length > 0 && (
        <Card>
          <CardTitle>New Pets</CardTitle>
          <div className="mt-4 space-y-3">
            {selectedPets
              .filter((p) => p.isNewPet)
              .map((pet, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{pet.petInfo?.name}</p>
                    <p className="text-sm text-gray-600">
                      {pet.petInfo?.breed} - {COAT_TYPE_LABELS[pet.petInfo?.coatType || 'medium']}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNewPet(selectedPets.indexOf(pet))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Add New Pet Form */}
      {showNewPetForm ? (
        <Card>
          <CardTitle>Add a New Pet</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label="Pet Name"
              value={newPetInfo.name || ''}
              onChange={(e) =>
                setNewPetInfo((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Species"
                options={[
                  { value: 'dog', label: 'Dog' },
                  { value: 'cat', label: 'Cat' },
                  { value: 'other', label: 'Other' },
                ]}
                value={newPetInfo.species || 'dog'}
                onChange={(e) =>
                  setNewPetInfo((p) => ({ ...p, species: e.target.value as Pet['species'], breed: '' }))
                }
              />
              {newPetInfo.species === 'other' ? (
                <Input
                  label="Breed"
                  value={newPetInfo.breed || ''}
                  onChange={(e) =>
                    setNewPetInfo((p) => ({ ...p, breed: e.target.value }))
                  }
                  placeholder="Enter breed"
                  required
                />
              ) : (
                <ComboBox
                  label="Breed"
                  options={breedOptions}
                  value={newPetInfo.breed || ''}
                  onChange={(value) =>
                    setNewPetInfo((p) => ({ ...p, breed: value }))
                  }
                  placeholder="Search or enter breed..."
                  allowCustomValue={true}
                  helperText="Select from list or type custom breed"
                />
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Size"
                options={Object.entries(WEIGHT_RANGE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={newPetInfo.weightRange || 'medium'}
                onChange={(e) =>
                  setNewPetInfo((p) => ({ ...p, weightRange: e.target.value as Pet['weightRange'] }))
                }
              />
              <Select
                label="Coat Type"
                options={Object.entries(COAT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={newPetInfo.coatType || 'medium'}
                onChange={(e) =>
                  setNewPetInfo((p) => ({ ...p, coatType: e.target.value as Pet['coatType'] }))
                }
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowNewPetForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={addNewPet}
                disabled={!newPetInfo.name || !newPetInfo.breed}
              >
                Add Pet
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowNewPetForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Pet
        </Button>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={selectedPets.length === 0}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
