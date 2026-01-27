import { useState } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { Plus, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Card, CardTitle, Button, Input, Select } from '@/components/common'
import { useClientPets } from '@/hooks'
import { COAT_TYPE_LABELS, WEIGHT_RANGE_LABELS } from '@/config/constants'
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

  const togglePet = (pet: Pet) => {
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
    navigate(`/book/${organization.slug}/intake?${params.toString()}`)
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/start`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Select Your Pets</h1>
        <p className="mt-2 text-gray-600">
          Which pets would you like to bring in for grooming?
        </p>
      </div>

      {/* Existing Pets */}
      {!isNewClient && existingPets.length > 0 && (
        <Card>
          <CardTitle>Your Pets</CardTitle>
          <div className="mt-4 space-y-3">
            {existingPets.map((pet) => {
              const isSelected = selectedPets.some((p) => p.petId === pet.id)
              return (
                <button
                  key={pet.id}
                  onClick={() => togglePet(pet)}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{pet.name}</p>
                    <p className="text-sm text-gray-600">
                      {pet.breed} - {COAT_TYPE_LABELS[pet.coatType]}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
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
                  setNewPetInfo((p) => ({ ...p, species: e.target.value as Pet['species'] }))
                }
              />
              <Input
                label="Breed"
                value={newPetInfo.breed || ''}
                onChange={(e) =>
                  setNewPetInfo((p) => ({ ...p, breed: e.target.value }))
                }
                required
              />
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
