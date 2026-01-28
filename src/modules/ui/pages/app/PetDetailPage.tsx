import { useParams, Link } from 'react-router-dom'
import { LoadingPage } from '../../components/common'
import { usePet, useClient, useUpdatePet, useAddVaccination, useRemoveVaccination } from '@/hooks'
import type { Pet } from '@/types'
import { useTheme } from '../../context'
import { cn } from '@/lib/utils'
import {
  PetHeader,
  PetInfoCard,
  BehaviorLevelCard,
  MedicalNotesCard,
  GroomingNotesCard,
  VaccinationSection,
} from '../../components/pets'
import type { PetInfoFormData } from '../../components/pets'

export function PetDetailPage() {
  const { colors } = useTheme()
  const { petId } = useParams<{ petId: string }>()
  const { data: pet, isLoading } = usePet(petId || '')
  const { data: client } = useClient(pet?.clientId || '')
  const updatePet = useUpdatePet()
  const addVaccination = useAddVaccination()
  const removeVaccination = useRemoveVaccination()

  if (isLoading) return <LoadingPage />

  if (!pet) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Pet not found</p>
        <Link to="/app/pets" className="text-primary-600 hover:underline">
          Back to pets
        </Link>
      </div>
    )
  }

  const handleBehaviorChange = async (level: number) => {
    await updatePet.mutateAsync({ id: pet.id, data: { behaviorLevel: level as Pet['behaviorLevel'] } })
  }

  const handleImageChange = async (imageUrl: string | null) => {
    await updatePet.mutateAsync({ id: pet.id, data: { imageUrl: imageUrl || undefined } })
  }

  const handleSaveNotes = async (notes: string) => {
    await updatePet.mutateAsync({ id: pet.id, data: { groomingNotes: notes } })
  }

  const handleSaveInfo = async (data: PetInfoFormData) => {
    await updatePet.mutateAsync({ id: pet.id, data })
  }

  const handleSaveMedicalNotes = async (notes: string) => {
    await updatePet.mutateAsync({ id: pet.id, data: { medicalNotes: notes } })
  }

  const handleAddVaccination = async (vaccination: { name: string; dateAdministered: string; expirationDate: string; documentUrl?: string }) => {
    await addVaccination.mutateAsync({ petId: pet.id, vaccination })
  }

  const handleUpdateVaccinations = async (vaccinations: typeof pet.vaccinations) => {
    await updatePet.mutateAsync({ id: pet.id, data: { vaccinations } })
  }

  const handleRemoveVaccination = async (vaccinationId: string) => {
    await removeVaccination.mutateAsync({ petId: pet.id, vaccinationId })
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <PetHeader pet={pet} onImageChange={handleImageChange} />

        <div className="grid gap-6 lg:grid-cols-3">
          <PetInfoCard
            pet={pet}
            client={client}
            onSaveInfo={handleSaveInfo}
            isSaving={updatePet.isPending}
          />
          <BehaviorLevelCard pet={pet} onBehaviorChange={handleBehaviorChange} />
          <MedicalNotesCard
            pet={pet}
            onSaveMedicalNotes={handleSaveMedicalNotes}
            isSaving={updatePet.isPending}
          />
        </div>

        <GroomingNotesCard
          pet={pet}
          onSaveNotes={handleSaveNotes}
          isSaving={updatePet.isPending}
        />

        <VaccinationSection
          pet={pet}
          onAddVaccination={handleAddVaccination}
          onUpdateVaccinations={handleUpdateVaccinations}
          onRemoveVaccination={handleRemoveVaccination}
          isAdding={addVaccination.isPending}
          isUpdating={updatePet.isPending}
          isRemoving={removeVaccination.isPending}
        />
      </div>
    </div>
  )
}
