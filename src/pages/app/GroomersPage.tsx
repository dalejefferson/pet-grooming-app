import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, Phone, X } from 'lucide-react'
import { Card, Button, Input, Badge, Modal, Toggle, ImageUpload } from '@/components/common'
import { useGroomers, useCreateGroomer, useUpdateGroomer, useDeleteGroomer } from '@/hooks'
import { formatPhone, cn } from '@/lib/utils'
import type { Groomer } from '@/types'
import { useTheme } from '@/context/ThemeContext'

const SPECIALTY_OPTIONS = [
  'Large Dogs',
  'Small Dogs',
  'Cats',
  'Puppy Grooming',
  'Senior Pets',
  'Dematting',
  'Poodle Cuts',
  'Breed-Specific Styles',
  'Show Cuts',
  'Nail Trimming',
  'Teeth Cleaning',
  'De-shedding',
  'Hand Stripping',
  'Creative Grooming',
]

function GroomerForm({
  groomer,
  onSubmit,
  onCancel,
  isLoading,
}: {
  groomer?: Groomer
  onSubmit: (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    firstName: groomer?.firstName || '',
    lastName: groomer?.lastName || '',
    email: groomer?.email || '',
    phone: groomer?.phone || '',
    specialties: groomer?.specialties || [],
    imageUrl: groomer?.imageUrl || '',
    isActive: groomer?.isActive ?? true,
  })
  const [newSpecialty, setNewSpecialty] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      organizationId: 'org-1',
      imageUrl: formData.imageUrl || undefined,
    })
  }

  const addSpecialty = (specialty: string) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      setFormData((p) => ({ ...p, specialties: [...p.specialties, specialty] }))
    }
    setNewSpecialty('')
  }

  const removeSpecialty = (specialty: string) => {
    setFormData((p) => ({
      ...p,
      specialties: p.specialties.filter((s) => s !== specialty),
    }))
  }

  const getInitials = () => {
    const first = formData.firstName.charAt(0) || ''
    const last = formData.lastName.charAt(0) || ''
    return first + last || '?'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center">
        <ImageUpload
          currentImage={formData.imageUrl || undefined}
          onImageChange={(url) => setFormData((p) => ({ ...p, imageUrl: url || '' }))}
          placeholder={getInitials()}
          size="lg"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
          required
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
        required
      />
      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
        required
      />

      {/* Specialties */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Specialties</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.specialties.map((specialty) => (
            <Badge key={specialty} variant="primary" size="sm" className="flex items-center gap-1">
              {specialty}
              <button
                type="button"
                onClick={() => removeSpecialty(specialty)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {formData.specialties.length === 0 && (
            <span className="text-sm text-gray-500">No specialties added</span>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            className="flex-1 rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2 text-sm shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2"
          >
            <option value="">Select a specialty...</option>
            {SPECIALTY_OPTIONS.filter((s) => !formData.specialties.includes(s)).map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => addSpecialty(newSpecialty)}
            disabled={!newSpecialty}
          >
            Add
          </Button>
        </div>
      </div>

      <Toggle
        label="Active"
        description="Inactive groomers won't appear in scheduling options"
        checked={formData.isActive}
        onChange={(checked) => setFormData((p) => ({ ...p, isActive: checked }))}
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {groomer ? 'Update' : 'Add'} Groomer
        </Button>
      </div>
    </form>
  )
}

function GroomerCard({
  groomer,
  onEdit,
  onDelete,
}: {
  groomer: Groomer
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = `${groomer.firstName.charAt(0)}${groomer.lastName.charAt(0)}`

  return (
    <Card colorVariant={groomer.isActive ? 'white' : 'lemon'} className="aspect-square flex flex-col items-center justify-center p-4 text-center relative">
      {/* Actions - Top Right */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-danger-500" />
        </Button>
      </div>

      {/* Profile Image or Initials */}
      {groomer.imageUrl ? (
        <img
          src={groomer.imageUrl}
          alt={`${groomer.firstName} ${groomer.lastName}`}
          className="h-20 w-20 rounded-2xl border-2 border-[#1e293b] object-cover shadow-[3px_3px_0px_0px_#1e293b]"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1e293b] bg-[#d1fae5] text-2xl font-bold text-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b]">
          {initials}
        </div>
      )}

      {/* Name */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <h3 className="font-semibold text-gray-900">
          {groomer.firstName} {groomer.lastName}
        </h3>
        {!groomer.isActive && (
          <Badge variant="secondary" size="sm">Inactive</Badge>
        )}
      </div>

      {/* Contact */}
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <div className="flex items-center justify-center gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          {formatPhone(groomer.phone)}
        </div>
      </div>

      {/* Specialties */}
      {groomer.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {groomer.specialties.slice(0, 2).map((specialty) => (
            <Badge key={specialty} variant="outline" size="sm">
              {specialty}
            </Badge>
          ))}
          {groomer.specialties.length > 2 && (
            <Badge variant="secondary" size="sm">
              +{groomer.specialties.length - 2}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}

export function GroomersPage() {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroomer, setEditingGroomer] = useState<Groomer | null>(null)

  const { data: groomers = [], isLoading } = useGroomers()
  const createGroomer = useCreateGroomer()
  const updateGroomer = useUpdateGroomer()
  const deleteGroomer = useDeleteGroomer()

  const filteredGroomers = groomers.filter((groomer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      groomer.firstName.toLowerCase().includes(query) ||
      groomer.lastName.toLowerCase().includes(query) ||
      groomer.email.toLowerCase().includes(query) ||
      groomer.specialties.some((s) => s.toLowerCase().includes(query))
    )
  })

  // Separate active and inactive groomers
  const activeGroomers = filteredGroomers.filter((g) => g.isActive)
  const inactiveGroomers = filteredGroomers.filter((g) => !g.isActive)

  const handleCreate = async (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createGroomer.mutateAsync(data)
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingGroomer) {
      await updateGroomer.mutateAsync({ id: editingGroomer.id, data })
      setEditingGroomer(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this groomer?')) {
      await deleteGroomer.mutateAsync(id)
    }
  }

  return (
    <div className={cn('min-h-full', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Groomers</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Groomer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search groomers by name, email, or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading groomers...</div>
      ) : filteredGroomers.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-gray-600">
              {searchQuery
                ? 'No groomers found matching your search.'
                : 'No groomers yet. Add your first groomer to get started.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Active Groomers */}
          {activeGroomers.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Active Groomers ({activeGroomers.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {activeGroomers.map((groomer) => (
                  <GroomerCard
                    key={groomer.id}
                    groomer={groomer}
                    onEdit={() => setEditingGroomer(groomer)}
                    onDelete={() => handleDelete(groomer.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Groomers */}
          {inactiveGroomers.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-500">
                Inactive Groomers ({inactiveGroomers.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {inactiveGroomers.map((groomer) => (
                  <GroomerCard
                    key={groomer.id}
                    groomer={groomer}
                    onEdit={() => setEditingGroomer(groomer)}
                    onDelete={() => handleDelete(groomer.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Groomer"
        size="md"
      >
        <GroomerForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createGroomer.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingGroomer}
        onClose={() => setEditingGroomer(null)}
        title="Edit Groomer"
        size="md"
      >
        {editingGroomer && (
          <GroomerForm
            groomer={editingGroomer}
            onSubmit={handleUpdate}
            onCancel={() => setEditingGroomer(null)}
            isLoading={updateGroomer.isPending}
          />
        )}
      </Modal>
      </div>
    </div>
  )
}
