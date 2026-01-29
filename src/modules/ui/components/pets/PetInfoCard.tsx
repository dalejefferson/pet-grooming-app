import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit2 } from 'lucide-react'
import { Card, CardTitle, Button, Input, Select, ComboBox } from '../common'
import { useTheme } from '../../context'
import { COAT_TYPE_LABELS, WEIGHT_RANGE_LABELS, DOG_BREEDS, CAT_BREEDS } from '@/config/constants'
import { format, parseISO } from 'date-fns'
import type { Pet, Client, PetSpecies, CoatType, WeightRange } from '@/types'

export interface PetInfoCardProps {
  pet: Pet
  client?: Client | null
  onSaveInfo?: (data: PetInfoFormData) => Promise<void>
  isSaving?: boolean
}

export interface PetInfoFormData {
  name: string
  species: PetSpecies
  breed: string
  weight: number
  weightRange: WeightRange
  coatType: CoatType
  birthDate?: string
}

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'other', label: 'Other' },
]

const COAT_TYPE_OPTIONS = Object.entries(COAT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

function calculateWeightRange(weight: number): WeightRange {
  if (weight <= 15) return 'small'
  if (weight <= 40) return 'medium'
  if (weight <= 80) return 'large'
  return 'xlarge'
}

export function PetInfoCard({ pet, client, onSaveInfo, isSaving }: PetInfoCardProps) {
  const { colors } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<PetInfoFormData>({
    name: '',
    species: 'dog',
    breed: '',
    weight: 0,
    weightRange: 'medium',
    coatType: 'short',
    birthDate: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PetInfoFormData, string>>>({})

  const handleStartEditing = () => {
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      weight: pet.weight,
      weightRange: pet.weightRange,
      coatType: pet.coatType,
      birthDate: pet.birthDate || '',
    })
    setErrors({})
    setIsEditing(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PetInfoFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.breed.trim()) {
      newErrors.breed = 'Breed is required'
    }
    if (formData.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0'
    }
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      if (birthDate > new Date()) {
        newErrors.birthDate = 'Birth date must be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !onSaveInfo) return

    const dataToSave = {
      ...formData,
      weightRange: calculateWeightRange(formData.weight),
      birthDate: formData.birthDate || undefined,
    }
    await onSaveInfo(dataToSave)
    setIsEditing(false)
  }

  const breedOptions =
    formData.species === 'dog'
      ? DOG_BREEDS.map((b) => ({ value: b, label: b }))
      : formData.species === 'cat'
        ? CAT_BREEDS.map((b) => ({ value: b, label: b }))
        : []

  if (isEditing) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Basic Information</CardTitle>
        </div>
        <div className="mt-4 space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <Select
            label="Species"
            options={SPECIES_OPTIONS}
            value={formData.species}
            onChange={(e) =>
              setFormData({ ...formData, species: e.target.value as PetSpecies, breed: '' })
            }
          />
          <ComboBox
            label="Breed"
            options={breedOptions}
            value={formData.breed}
            onChange={(value) => setFormData({ ...formData, breed: value })}
            placeholder="Select or type a breed"
            error={errors.breed}
            allowCustomValue
          />
          <Input
            label="Weight (lbs)"
            type="number"
            min="0.1"
            step="0.1"
            value={formData.weight || ''}
            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
            error={errors.weight}
          />
          <Select
            label="Coat Type"
            options={COAT_TYPE_OPTIONS}
            value={formData.coatType}
            onChange={(e) => setFormData({ ...formData, coatType: e.target.value as CoatType })}
          />
          <Input
            label="Birth Date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            error={errors.birthDate}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
              className="hover:opacity-90"
            >
              Save
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Basic Information</CardTitle>
        {onSaveInfo && (
          <Button variant="ghost" size="sm" onClick={handleStartEditing}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm text-gray-500">Owner</dt>
          <dd className="font-medium text-gray-900">
            {client ? (
              <Link to={`/app/clients/${client.id}`} className="text-primary-600 hover:underline">
                {client.firstName} {client.lastName}
              </Link>
            ) : (
              'Unknown'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Weight</dt>
          <dd className="font-medium text-gray-900">
            {pet.weight > 0 ? `${pet.weight} lbs` : WEIGHT_RANGE_LABELS[pet.weightRange]}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Coat Type</dt>
          <dd className="font-medium text-gray-900">{COAT_TYPE_LABELS[pet.coatType]}</dd>
        </div>
        {pet.birthDate && (
          <div>
            <dt className="text-sm text-gray-500">Birth Date</dt>
            <dd className="font-medium text-gray-900">
              {format(parseISO(pet.birthDate), 'MMMM d, yyyy')}
            </dd>
          </div>
        )}
        {pet.lastGroomingDate && (
          <div>
            <dt className="text-sm text-gray-500">Last Grooming</dt>
            <dd className="font-medium text-gray-900">
              {format(parseISO(pet.lastGroomingDate), 'MMMM d, yyyy')}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  )
}
