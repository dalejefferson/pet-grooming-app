import { useState } from 'react'
import { Plus, Shield } from 'lucide-react'
import { Card, CardTitle, Button } from '../common'
import type { Pet, VaccinationRecord } from '@/types'
import { VaccinationCard } from './VaccinationCard'
import { VaccinationFormModal } from './VaccinationFormModal'
import { DeleteVaccinationModal } from './DeleteVaccinationModal'

export interface VaccinationSectionProps {
  pet: Pet
  onAddVaccination: (vaccination: Omit<VaccinationRecord, 'id'>) => Promise<void>
  onUpdateVaccinations: (vaccinations: VaccinationRecord[]) => Promise<void>
  onRemoveVaccination: (vaccinationId: string) => Promise<void>
  isAdding: boolean
  isUpdating: boolean
  isRemoving: boolean
}

export function VaccinationSection({
  pet,
  onAddVaccination,
  onUpdateVaccinations,
  onRemoveVaccination,
  isAdding,
  isUpdating,
  isRemoving,
}: VaccinationSectionProps) {
  const [showVaxModal, setShowVaxModal] = useState(false)
  const [editingVax, setEditingVax] = useState<VaccinationRecord | null>(null)
  const [deletingVaxId, setDeletingVaxId] = useState<string | null>(null)

  const handleOpenAddModal = () => {
    setEditingVax(null)
    setShowVaxModal(true)
  }

  const handleOpenEditModal = (vax: VaccinationRecord) => {
    setEditingVax(vax)
    setShowVaxModal(true)
  }

  const handleCloseModal = () => {
    setShowVaxModal(false)
    setEditingVax(null)
  }

  const handleSaveVaccination = async (data: { name: string; dateAdministered: string; expirationDate: string; documentUrl?: string }) => {
    if (editingVax) {
      // Update existing vaccination
      const updatedVaccinations = pet.vaccinations.map(v =>
        v.id === editingVax.id ? { ...v, ...data } : v
      )
      await onUpdateVaccinations(updatedVaccinations)
    } else {
      // Add new vaccination
      await onAddVaccination(data)
    }
    handleCloseModal()
  }

  const handleConfirmDelete = async () => {
    if (deletingVaxId) {
      await onRemoveVaccination(deletingVaxId)
      setDeletingVaxId(null)
    }
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#1e293b]" />
            <CardTitle>Vaccination Records</CardTitle>
          </div>
          <Button size="sm" onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vaccination
          </Button>
        </div>

        {pet.vaccinations.length === 0 ? (
          <div className="mt-6 py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#f1f5f9] border-2 border-[#1e293b] flex items-center justify-center shadow-[2px_2px_0px_0px_#1e293b]">
              <Shield className="h-8 w-8 text-[#64748b]" />
            </div>
            <p className="mt-4 text-[#64748b] font-medium">No vaccination records yet.</p>
            <p className="mt-1 text-sm text-[#94a3b8]">Add records to track your pet's immunizations.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pet.vaccinations.map((vax) => (
              <VaccinationCard
                key={vax.id}
                vaccination={vax}
                onEdit={handleOpenEditModal}
                onDelete={setDeletingVaxId}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        {pet.vaccinations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1e293b]/20">
            <p className="text-xs text-[#94a3b8] font-medium mb-2">Status Legend:</p>
            <div className="flex flex-wrap gap-4 text-xs text-[#64748b]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#22c55e] border border-[#1e293b]" />
                <span>Valid (more than 30 days)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#eab308] border border-[#1e293b]" />
                <span>Expiring Soon (30 days or less)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#ef4444] border border-[#1e293b]" />
                <span>Expired</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <VaccinationFormModal
        isOpen={showVaxModal}
        onClose={handleCloseModal}
        onSave={handleSaveVaccination}
        editingVaccination={editingVax}
        isSaving={isAdding || isUpdating}
      />

      <DeleteVaccinationModal
        isOpen={!!deletingVaxId}
        onClose={() => setDeletingVaxId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isRemoving}
      />
    </>
  )
}
