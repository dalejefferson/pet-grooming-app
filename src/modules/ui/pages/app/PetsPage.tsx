import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, User, Trash2, PawPrint } from 'lucide-react'
import { Card, Input, Badge, HistorySection, ConfirmDialog, Skeleton, EmptyState } from '../../components/common'
import { usePets, useClients, useDeletePet, useCreatePet, useDeletedHistory, useAddToHistory } from '@/hooks'
import { debounce } from '@/lib/utils/debounce'
import type { Pet, Client } from '@/types'
import { BEHAVIOR_LEVEL_LABELS } from '@/config/constants'
import { useTheme, useUndo } from '../../context'
import { cn } from '@/lib/utils'

// PetCard component with hover delete button
function PetCard({ pet, client, onDelete }: { pet: Pet; client?: Client; onDelete: () => void }) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/app/pets/${pet.id}`)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <Card
      className="aspect-square flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer hover:shadow-[4px_4px_0px_0px_#1e293b] hover:-translate-y-0.5 relative group"
      onClick={handleCardClick}
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        aria-label="Delete pet"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </button>

      {/* Pet Image */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1e293b] bg-[#e0f2fe] text-2xl font-bold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b] overflow-hidden">
        {pet.imageUrl ? (
          <img src={pet.imageUrl} alt={pet.name} className="h-full w-full object-cover" />
        ) : (
          <span>{pet.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Name */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
        {pet.behaviorLevel >= 4 && (
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-500" />
        )}
      </div>

      {/* Breed */}
      <p className="mt-1 text-sm text-gray-600 truncate">{pet.breed}</p>

      {/* Owner */}
      {client && (
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{client.firstName} {client.lastName}</span>
        </div>
      )}

      {/* Badges */}
      <div className="mt-3 flex flex-wrap justify-center gap-1">
        <Badge variant="secondary" size="sm">
          {pet.species}
        </Badge>
        <Badge
          variant={pet.behaviorLevel <= 2 ? 'success' : pet.behaviorLevel >= 4 ? 'warning' : 'secondary'}
          size="sm"
        >
          {BEHAVIOR_LEVEL_LABELS[pet.behaviorLevel]}
        </Badge>
      </div>
    </Card>
  )
}

export function PetsPage() {
  const { colors } = useTheme()
  const { showUndo } = useUndo()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [petToDeleteId, setPetToDeleteId] = useState<string | null>(null)
  const { data: pets = [], isLoading } = usePets()
  const { data: clients = [] } = useClients()
  const { data: deletedItems = [] } = useDeletedHistory('pet')
  const deletePet = useDeletePet()
  const createPet = useCreatePet()
  const addToHistory = useAddToHistory()

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 300),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    debouncedSetQuery(e.target.value)
  }

  const handleDeletePet = async (petId: string) => {
    const petToDelete = pets.find(p => p.id === petId)
    if (!petToDelete) return

    await deletePet.mutateAsync(petId)

    // Add to history for restore functionality
    await addToHistory.mutateAsync({
      entityType: 'pet',
      entityId: petToDelete.id,
      entityName: petToDelete.name,
      data: petToDelete,
    })

    showUndo({
      type: 'pet',
      label: petToDelete.name,
      data: petToDelete,
      onUndo: async () => {
        const { id, createdAt, updatedAt, ...petData } = petToDelete
        await createPet.mutateAsync(petData)
      }
    })
  }

  const filteredPets = useMemo(() => pets.filter((pet) => {
    if (!debouncedQuery) return true
    const query = debouncedQuery.toLowerCase()
    const client = clients.find((c) => c.id === pet.clientId)
    return (
      pet.name.toLowerCase().includes(query) ||
      pet.breed.toLowerCase().includes(query) ||
      client?.firstName.toLowerCase().includes(query) ||
      client?.lastName.toLowerCase().includes(query)
    )
  }), [pets, clients, debouncedQuery])

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pets</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search pets or owners..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={10} />
      ) : filteredPets.length === 0 ? (
        <EmptyState
          icon={<PawPrint className="h-8 w-8" />}
          title={debouncedQuery ? 'No pets found' : 'No pets registered yet'}
          description={debouncedQuery ? 'No pets match your search. Try a different term.' : 'Pets will appear here once clients add them.'}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredPets.map((pet) => {
            const client = clients.find((c) => c.id === pet.clientId)
            return (
              <PetCard
                key={pet.id}
                pet={pet}
                client={client}
                onDelete={() => {
                  setPetToDeleteId(pet.id)
                  setDeleteConfirmOpen(true)
                }}
              />
            )
          })}
        </div>
      )}

      <HistorySection
        items={deletedItems}
        entityType="pet"
        title="Recently Deleted Pets"
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setPetToDeleteId(null)
        }}
        onConfirm={async () => {
          if (petToDeleteId) {
            await handleDeletePet(petToDeleteId)
          }
          setDeleteConfirmOpen(false)
          setPetToDeleteId(null)
        }}
        title="Delete Pet?"
        message="This will remove the pet. You can restore from history."
        variant="danger"
        confirmLabel="Delete"
      />
      </div>
    </div>
  )
}
