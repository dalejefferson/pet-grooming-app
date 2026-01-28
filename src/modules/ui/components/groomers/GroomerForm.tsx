import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, Input, Badge, Toggle, ImageUpload } from '../common'
import { useTheme } from '../../context'
import type { Groomer } from '@/types'

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

interface GroomerFormProps {
  groomer?: Groomer
  onSubmit: (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading: boolean
}

export function GroomerForm({
  groomer,
  onSubmit,
  onCancel,
  isLoading,
}: GroomerFormProps) {
  const { colors } = useTheme()
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
      role: groomer?.role || 'groomer', // Default to groomer role for new staff
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
            <Badge key={specialty} variant="primary" size="sm" className="flex items-center gap-1 py-1.5">
              {specialty}
              <button
                type="button"
                onClick={() => removeSpecialty(specialty)}
                className="ml-1 p-0.5 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
          {formData.specialties.length === 0 && (
            <span className="text-sm text-gray-500">No specialties added</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            className="flex-1 rounded-xl border-2 border-[#1e293b] bg-white px-3 py-3 sm:py-2 text-sm shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2"
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
            className="min-h-[44px] sm:min-h-0"
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

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] sm:min-h-0">
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          className="min-h-[44px] sm:min-h-0 hover:opacity-90"
          style={{ backgroundColor: colors.accentColorDark }}
        >
          {groomer ? 'Update' : 'Add'} Groomer
        </Button>
      </div>
    </form>
  )
}
