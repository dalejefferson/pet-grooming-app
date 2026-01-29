import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Edit2, User, Calendar, BarChart3, Clock } from 'lucide-react'
import { Card, CardTitle, Button, Badge, Modal, Input, Select, Toggle, ImageUpload } from '../../components/common'
import { LoadingPage } from '../../components/common/LoadingSpinner'
import {
  StaffAvailabilityForm,
  StaffPerformanceDashboard,
  TimeOffManager,
} from '../../components/staff'
import { useGroomer, useUpdateGroomer } from '@/hooks'
import { PermissionGate, usePermissions } from '@/modules/auth'
import { formatPhone, cn } from '@/lib/utils'
import type { Groomer } from '@/types'
import { useTheme } from '../../context'

type TabValue = 'overview' | 'availability' | 'performance' | 'timeoff'

const ROLE_BADGES: Record<Groomer['role'], { color: string; bgColor: string; label: string }> = {
  admin: {
    color: 'text-[#7c3aed]',
    bgColor: 'bg-[#e9d5ff]',
    label: 'Admin',
  },
  groomer: {
    color: 'text-[#2563eb]',
    bgColor: 'bg-[#bfdbfe]',
    label: 'Groomer',
  },
  receptionist: {
    color: 'text-[#16a34a]',
    bgColor: 'bg-[#d1fae5]',
    label: 'Receptionist',
  },
}

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

interface EditFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: Groomer['role']
  specialties: string[]
  imageUrl: string
  isActive: boolean
}

function EditStaffModal({
  staff,
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  staff: Groomer
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Groomer>) => Promise<void>
  isLoading: boolean
}) {
  const { colors } = useTheme()
  const [formData, setFormData] = useState<EditFormData>({
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    specialties: staff.specialties,
    imageUrl: staff.imageUrl || '',
    isActive: staff.isActive,
  })
  const [newSpecialty, setNewSpecialty] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...formData,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Staff Member" size="md">
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

        <Select
          label="Role"
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'groomer', label: 'Groomer' },
            { value: 'receptionist', label: 'Receptionist' },
          ]}
          value={formData.role}
          onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as Groomer['role'] }))}
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
                  <span className="sr-only">Remove</span>
                  &times;
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
          description="Inactive staff won't appear in scheduling options"
          checked={formData.isActive}
          onChange={(checked) => setFormData((p) => ({ ...p, isActive: checked }))}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="min-h-[44px] sm:min-h-0">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            className="min-h-[44px] sm:min-h-0 hover:opacity-90"
            style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function StaffDetailPage() {
  const { colors } = useTheme()
  const { staffId } = useParams<{ staffId: string }>()
  const { data: staff, isLoading } = useGroomer(staffId || '')
  const updateGroomer = useUpdateGroomer()
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('canManageStaff')

  const [activeTab, setActiveTab] = useState<TabValue>('overview')
  const [showEditModal, setShowEditModal] = useState(false)

  if (isLoading) return <LoadingPage />

  if (!staff) {
    return (
      <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">Staff member not found</p>
          <Link to="/app/staff" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Staff
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const initials = `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`
  const roleBadge = ROLE_BADGES[staff.role]

  const handleSave = async (data: Partial<Groomer>) => {
    await updateGroomer.mutateAsync({ id: staff.id, data })
    setShowEditModal(false)
  }

  const handleImageChange = async (imageUrl: string | null) => {
    await updateGroomer.mutateAsync({ id: staff.id, data: { imageUrl: imageUrl || undefined } })
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/app/staff">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="relative">
              <ImageUpload
                currentImage={staff.imageUrl}
                onImageChange={isAdmin ? handleImageChange : () => {}}
                placeholder={initials}
                size="lg"
              />
              {/* Status indicator */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#1e293b]',
                  staff.isActive ? 'bg-[#22c55e]' : 'bg-[#94a3b8]'
                )}
                title={staff.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {staff.firstName} {staff.lastName}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <div
                  className={cn(
                    'inline-flex items-center rounded-lg border-2 border-[#1e293b] px-2 py-0.5 text-xs font-semibold shadow-[2px_2px_0px_0px_#1e293b]',
                    roleBadge.bgColor,
                    roleBadge.color
                  )}
                >
                  {roleBadge.label}
                </div>
                {!staff.isActive && (
                  <Badge variant="warning" size="sm">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <PermissionGate permission="canManageStaff">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </PermissionGate>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'overview' as TabValue, label: 'Overview', icon: User },
            { value: 'availability' as TabValue, label: 'Availability', icon: Calendar },
            { value: 'performance' as TabValue, label: 'Performance', icon: BarChart3 },
            { value: 'timeoff' as TabValue, label: 'Time Off', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-2 rounded-xl border-2 border-[#1e293b] px-4 py-2 text-sm font-semibold transition-all',
                activeTab === tab.value
                  ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-white text-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Information */}
            <Card padding="lg">
              <CardTitle>Contact Information</CardTitle>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a
                    href={`mailto:${staff.email}`}
                    className="hover:underline"
                    style={{ color: colors.accentColorDark }}
                  >
                    {staff.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a
                    href={`tel:${staff.phone}`}
                    className="hover:underline"
                    style={{ color: colors.accentColorDark }}
                  >
                    {formatPhone(staff.phone)}
                  </a>
                </div>
              </div>
            </Card>

            {/* Specialties */}
            <Card padding="lg">
              <CardTitle>Specialties</CardTitle>
              {staff.specialties.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {staff.specialties.map((specialty) => (
                    <Badge key={specialty} variant="primary" size="sm">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-gray-500">No specialties listed.</p>
              )}
            </Card>

            {/* Status Card */}
            <Card padding="lg" colorVariant={staff.isActive ? 'mint' : 'lemon'}>
              <CardTitle>Status</CardTitle>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      staff.isActive ? 'bg-[#22c55e]' : 'bg-[#94a3b8]'
                    )}
                  />
                  <span className="font-medium text-[#1e293b]">
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#64748b]">
                  {staff.isActive
                    ? 'This staff member is available for scheduling.'
                    : 'This staff member is not available for scheduling.'}
                </p>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card padding="lg">
              <CardTitle>Quick Info</CardTitle>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Role</span>
                  <span className="font-medium text-[#1e293b]">{roleBadge.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Member Since</span>
                  <span className="font-medium text-[#1e293b]">
                    {new Date(staff.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && <StaffAvailabilityForm staffId={staff.id} />}

        {/* Performance Tab */}
        {activeTab === 'performance' && <StaffPerformanceDashboard staffId={staff.id} />}

        {/* Time Off Tab */}
        {activeTab === 'timeoff' && <TimeOffManager staffId={staff.id} isAdmin={isAdmin} />}

        {/* Edit Modal */}
        <EditStaffModal
          staff={staff}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
          isLoading={updateGroomer.isPending}
        />
      </div>
    </div>
  )
}
