import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button, ImageUpload } from '../common'
import type { Pet } from '@/types'

export interface PetHeaderProps {
  pet: Pet
  onImageChange: (imageUrl: string | null) => Promise<void>
}

export function PetHeader({ pet, onImageChange }: PetHeaderProps) {
  const petInitial = pet.name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-4">
      <Link to="/app/pets">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <ImageUpload
        currentImage={pet.imageUrl}
        onImageChange={onImageChange}
        placeholder={petInitial}
        size="lg"
        bucket="pet-images"
      />
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
          {pet.behaviorLevel >= 4 && (
            <AlertTriangle className="h-5 w-5 text-warning-500" />
          )}
        </div>
        <p className="text-gray-600">
          {pet.breed} - {pet.species}
        </p>
      </div>
    </div>
  )
}
