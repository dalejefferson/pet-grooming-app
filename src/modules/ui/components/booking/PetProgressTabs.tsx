import { Check } from 'lucide-react'
import type { Pet } from '@/types'

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

interface PetProgressTabsProps {
  selectedPets: SelectedPet[]
  clientPets: Pet[]
  currentPetIndex: number
  onSelectPet: (index: number) => void
}

export function PetProgressTabs({
  selectedPets,
  clientPets,
  currentPetIndex,
  onSelectPet,
}: PetProgressTabsProps) {
  if (selectedPets.length <= 1) {
    return null
  }

  return (
    <div className="flex gap-2">
      {selectedPets.map((pet, index) => {
        const name = pet.isNewPet
          ? pet.petInfo?.name
          : clientPets.find((p) => p.id === pet.petId)?.name
        return (
          <button
            key={index}
            onClick={() => onSelectPet(index)}
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
  )
}
