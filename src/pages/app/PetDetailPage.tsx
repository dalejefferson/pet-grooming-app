import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Trash2, AlertTriangle, Shield, Calendar, Clock, Upload } from 'lucide-react'
import { Card, CardTitle, Button, Badge, LoadingPage, Modal, Input, Textarea, ImageUpload, Select } from '@/components/common'
import { usePet, useClient, useUpdatePet, useAddVaccination, useRemoveVaccination } from '@/hooks'
import { BEHAVIOR_LEVEL_LABELS, COAT_TYPE_LABELS, WEIGHT_RANGE_LABELS } from '@/config/constants'
import { format, parseISO, differenceInDays } from 'date-fns'
import type { Pet, VaccinationRecord } from '@/types'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

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

// Calculate vaccination status
type VaxStatus = 'valid' | 'expiring' | 'expired'

function getVaccinationStatus(expirationDate: string): VaxStatus {
  const expDate = parseISO(expirationDate)
  const today = new Date()
  const daysUntilExpiration = differenceInDays(expDate, today)

  if (daysUntilExpiration < 0) return 'expired'
  if (daysUntilExpiration <= 30) return 'expiring'
  return 'valid'
}

function getDaysUntilExpiration(expirationDate: string): number {
  return differenceInDays(parseISO(expirationDate), new Date())
}

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

export function PetDetailPage() {
  const { colors } = useTheme()
  const { petId } = useParams<{ petId: string }>()
  const { data: pet, isLoading } = usePet(petId || '')
  const { data: client } = useClient(pet?.clientId || '')
  const updatePet = useUpdatePet()
  const addVaccination = useAddVaccination()
  const removeVaccination = useRemoveVaccination()

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [groomingNotes, setGroomingNotes] = useState('')
  const [showVaxModal, setShowVaxModal] = useState(false)
  const [vaxForm, setVaxForm] = useState<VaxFormState>(initialVaxForm)
  const [editingVaxId, setEditingVaxId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)


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

  const handleSaveNotes = async () => {
    await updatePet.mutateAsync({ id: pet.id, data: { groomingNotes } })
    setIsEditingNotes(false)
  }

  const handleRemoveVaccination = async (vaccinationId: string) => {
    await removeVaccination.mutateAsync({ petId: pet.id, vaccinationId })
    setShowDeleteConfirm(null)
  }

  // Open modal for adding new vaccination
  const openAddVaxModal = () => {
    setVaxForm(initialVaxForm)
    setEditingVaxId(null)
    setShowVaxModal(true)
  }

  // Open modal for editing existing vaccination
  const openEditVaxModal = (vax: VaccinationRecord) => {
    const matchingOption = COMMON_VACCINATIONS.find(opt => opt.value === vax.name)
    setVaxForm({
      name: matchingOption ? vax.name : 'custom',
      customName: matchingOption ? '' : vax.name,
      dateAdministered: vax.dateAdministered,
      expirationDate: vax.expirationDate,
      documentUrl: vax.documentUrl,
    })
    setEditingVaxId(vax.id)
    setShowVaxModal(true)
  }

  // Handle vaccination form save (add or edit)
  const handleSaveVaccination = async () => {
    const vaccinationName = vaxForm.name === 'custom' ? vaxForm.customName : vaxForm.name

    if (!vaccinationName || !vaxForm.dateAdministered || !vaxForm.expirationDate) {
      return
    }

    const vaccinationData = {
      name: vaccinationName,
      dateAdministered: vaxForm.dateAdministered,
      expirationDate: vaxForm.expirationDate,
      documentUrl: vaxForm.documentUrl,
    }

    if (editingVaxId) {
      // Update existing vaccination by updating the pet's vaccinations array
      const updatedVaccinations = pet.vaccinations.map(v =>
        v.id === editingVaxId ? { ...v, ...vaccinationData } : v
      )
      await updatePet.mutateAsync({ id: pet.id, data: { vaccinations: updatedVaccinations } })
    } else {
      // Add new vaccination
      await addVaccination.mutateAsync({ petId: pet.id, vaccination: vaccinationData })
    }

    setShowVaxModal(false)
    setVaxForm(initialVaxForm)
    setEditingVaxId(null)
  }

  const handleBehaviorChange = async (level: number) => {
    await updatePet.mutateAsync({ id: pet.id, data: { behaviorLevel: level as Pet['behaviorLevel'] } })
  }

  const handleImageChange = async (imageUrl: string | null) => {
    await updatePet.mutateAsync({ id: pet.id, data: { imageUrl: imageUrl || undefined } })
  }

  const petInitial = pet.name.charAt(0).toUpperCase()

  return (
    <div className={cn('min-h-full', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/app/pets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <ImageUpload
            currentImage={pet.imageUrl}
            onImageChange={handleImageChange}
            placeholder={petInitial}
            size="lg"
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Info */}
        <Card>
          <CardTitle>Basic Information</CardTitle>
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

        {/* Behavior Level */}
        <Card>
          <CardTitle>Behavior Level</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                variant={pet.behaviorLevel <= 2 ? 'success' : pet.behaviorLevel >= 4 ? 'warning' : 'secondary'}
              >
                {BEHAVIOR_LEVEL_LABELS[pet.behaviorLevel]}
              </Badge>
              <span className="text-sm text-gray-500">{pet.behaviorLevel}/5</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => handleBehaviorChange(level)}
                  className={`h-8 flex-1 rounded text-sm font-medium transition-colors ${
                    level === pet.behaviorLevel
                      ? level <= 2
                        ? 'bg-success-500 text-white'
                        : level >= 4
                        ? 'bg-warning-500 text-white'
                        : 'bg-gray-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              1 = Very Calm, 5 = Difficult
            </p>
          </div>
        </Card>

        {/* Medical Notes */}
        {pet.medicalNotes && (
          <Card className="border-warning-200 bg-warning-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <CardTitle>Medical Notes</CardTitle>
            </div>
            <p className="mt-4 text-gray-700">{pet.medicalNotes}</p>
          </Card>
        )}
      </div>

      {/* Grooming Notes */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Grooming Notes</CardTitle>
          {!isEditingNotes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGroomingNotes(pet.groomingNotes || '')
                setIsEditingNotes(true)
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isEditingNotes ? (
          <div className="mt-4 space-y-4">
            <Textarea
              value={groomingNotes}
              onChange={(e) => setGroomingNotes(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNotes} loading={updatePet.isPending}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-gray-700">
            {pet.groomingNotes || 'No grooming notes yet.'}
          </p>
        )}
      </Card>

      {/* Vaccinations */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#1e293b]" />
            <CardTitle>Vaccination Records</CardTitle>
          </div>
          <Button size="sm" onClick={openAddVaxModal}>
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
            {pet.vaccinations.map((vax) => {
              const status = getVaccinationStatus(vax.expirationDate)
              const daysUntil = getDaysUntilExpiration(vax.expirationDate)

              // Status-based styling
              const statusStyles = {
                valid: {
                  border: 'border-l-[#22c55e]',
                  bg: 'bg-[#f0fdf4]',
                  badge: 'success' as const,
                  badgeText: `${daysUntil} days left`,
                },
                expiring: {
                  border: 'border-l-[#eab308]',
                  bg: 'bg-[#fefce8]',
                  badge: 'warning' as const,
                  badgeText: daysUntil === 0 ? 'Expires today' : `${daysUntil} days left`,
                },
                expired: {
                  border: 'border-l-[#ef4444]',
                  bg: 'bg-[#fef2f2]',
                  badge: 'danger' as const,
                  badgeText: 'Expired',
                },
              }

              const style = statusStyles[status]

              return (
                <div
                  key={vax.id}
                  className={`relative rounded-xl border-2 border-[#1e293b] border-l-4 ${style.border} ${style.bg} p-4 shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5`}
                >
                  {/* Header with name and status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[#1e293b] text-base">{vax.name}</h4>
                    <Badge variant={style.badge} size="sm">
                      {style.badgeText}
                    </Badge>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Administered: {format(parseISO(vax.dateAdministered), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expires: {format(parseISO(vax.expirationDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#e2e8f0]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditVaxModal(vax)}
                      className="text-[#64748b] hover:text-[#1e293b]"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(vax.id)}
                      className="text-[#64748b] hover:text-[#ef4444]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        {pet.vaccinations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
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

      {/* Add/Edit Vaccination Modal */}
      <Modal
        isOpen={showVaxModal}
        onClose={() => {
          setShowVaxModal(false)
          setVaxForm(initialVaxForm)
          setEditingVaxId(null)
        }}
        title={editingVaxId ? 'Edit Vaccination Record' : 'Add Vaccination Record'}
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

          {/* Document Upload Placeholder */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
              Document (Optional)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center">
                <Upload className="mx-auto h-6 w-6 text-[#94a3b8]" />
                <p className="mt-1 text-sm text-[#64748b]">Upload vaccination certificate</p>
                <p className="text-xs text-[#94a3b8]">PDF, JPG, or PNG (Coming soon)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowVaxModal(false)
                setVaxForm(initialVaxForm)
                setEditingVaxId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVaccination}
              loading={addVaccination.isPending || updatePet.isPending}
              disabled={
                (!vaxForm.name || (vaxForm.name === 'custom' && !vaxForm.customName)) ||
                !vaxForm.dateAdministered ||
                !vaxForm.expirationDate
              }
            >
              {editingVaxId ? 'Save Changes' : 'Add Record'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Vaccination Record"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#fee2e2] p-2">
                <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
              </div>
              <div>
                <p className="font-semibold text-[#1e293b]">Are you sure?</p>
                <p className="mt-1 text-sm text-[#64748b]">
                  This action cannot be undone. The vaccination record will be permanently removed.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleRemoveVaccination(showDeleteConfirm)}
              loading={removeVaccination.isPending}
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  )
}
