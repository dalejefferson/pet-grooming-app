import { useState, useEffect } from 'react'
import { Modal, Button, Input, Select, DocumentUpload } from '../common'
import { useTheme } from '../../context'
import type { VaccinationRecord } from '@/types'

// Common vaccination names for dropdown
const COMMON_VACCINATIONS = [
  { value: 'Rabies', label: 'Rabies' },
  { value: 'Bordetella', label: 'Bordetella (Kennel Cough)' },
  { value: 'DHPP', label: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)' },
  { value: 'Leptospirosis', label: 'Leptospirosis' },
  { value: 'Lyme Disease', label: 'Lyme Disease' },
  { value: 'Canine Influenza', label: 'Canine Influenza' },
  { value: 'FVRCP', label: 'FVRCP (Cats)' },
  { value: 'FeLV', label: 'FeLV (Cats)' },
  { value: 'custom', label: '-- Custom Name --' },
]

// Vaccination form state type
interface VaxFormState {
  name: string
  customName: string
  dateAdministered: string
  expirationDate: string
  documentUrl?: string
}

const initialVaxForm: VaxFormState = {
  name: '',
  customName: '',
  dateAdministered: '',
  expirationDate: '',
  documentUrl: undefined,
}

export interface VaccinationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; dateAdministered: string; expirationDate: string; documentUrl?: string }) => Promise<void>
  editingVaccination: VaccinationRecord | null
  isSaving: boolean
}

export function VaccinationFormModal({
  isOpen,
  onClose,
  onSave,
  editingVaccination,
  isSaving,
}: VaccinationFormModalProps) {
  const { colors } = useTheme()
  const [vaxForm, setVaxForm] = useState<VaxFormState>(initialVaxForm)

  // Reset form when modal opens/closes or editing vaccination changes
  useEffect(() => {
    if (isOpen) {
      if (editingVaccination) {
        const matchingOption = COMMON_VACCINATIONS.find(opt => opt.value === editingVaccination.name)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync form state from props when modal opens
        setVaxForm({
          name: matchingOption ? editingVaccination.name : 'custom',
          customName: matchingOption ? '' : editingVaccination.name,
          dateAdministered: editingVaccination.dateAdministered,
          expirationDate: editingVaccination.expirationDate,
          documentUrl: editingVaccination.documentUrl,
        })
      } else {
        setVaxForm(initialVaxForm)
      }
    }
  }, [isOpen, editingVaccination])

  const handleSave = async () => {
    const vaccinationName = vaxForm.name === 'custom' ? vaxForm.customName : vaxForm.name

    if (!vaccinationName || !vaxForm.dateAdministered || !vaxForm.expirationDate) {
      return
    }

    await onSave({
      name: vaccinationName,
      dateAdministered: vaxForm.dateAdministered,
      expirationDate: vaxForm.expirationDate,
      documentUrl: vaxForm.documentUrl,
    })

    setVaxForm(initialVaxForm)
  }

  const handleClose = () => {
    setVaxForm(initialVaxForm)
    onClose()
  }

  const isFormValid = (vaxForm.name && (vaxForm.name !== 'custom' || vaxForm.customName)) &&
    vaxForm.dateAdministered &&
    vaxForm.expirationDate

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingVaccination ? 'Edit Vaccination Record' : 'Add Vaccination Record'}
      size="md"
    >
      <div className="space-y-4">
        {/* Vaccination Name Dropdown */}
        <Select
          label="Vaccination Name"
          value={vaxForm.name}
          onChange={(e) => setVaxForm((p) => ({ ...p, name: e.target.value, customName: '' }))}
          options={COMMON_VACCINATIONS}
          placeholder="Select vaccination type..."
        />

        {/* Custom Name Input (shown when "Custom" is selected) */}
        {vaxForm.name === 'custom' && (
          <Input
            label="Custom Vaccination Name"
            value={vaxForm.customName}
            onChange={(e) => setVaxForm((p) => ({ ...p, customName: e.target.value }))}
            placeholder="Enter vaccination name..."
          />
        )}

        {/* Date Administered */}
        <Input
          label="Date Administered"
          type="date"
          value={vaxForm.dateAdministered}
          onChange={(e) => setVaxForm((p) => ({ ...p, dateAdministered: e.target.value }))}
        />

        {/* Expiration Date */}
        <Input
          label="Expiration Date"
          type="date"
          value={vaxForm.expirationDate}
          onChange={(e) => setVaxForm((p) => ({ ...p, expirationDate: e.target.value }))}
        />

        {/* Document Upload */}
        <DocumentUpload
          label="Document"
          currentDocument={vaxForm.documentUrl}
          onDocumentChange={(url) => setVaxForm((p) => ({ ...p, documentUrl: url || undefined }))}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={!isFormValid}
            style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
            className="hover:opacity-90"
          >
            {editingVaccination ? 'Save Changes' : 'Add Record'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
