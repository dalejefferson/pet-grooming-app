import { useState } from 'react'
import { Button, Input, Select, Textarea, Toggle } from '../common'
import { useTheme } from '../../context'
import { SERVICE_CATEGORIES } from '@/config/constants'
import { useCurrentUser } from '@/modules/auth'
import type { Service } from '@/types'

interface ServiceFormProps {
  service?: Service
  onSubmit: (data: Partial<Service>) => void
  onCancel: () => void
  isLoading: boolean
}

export function ServiceForm({
  service,
  onSubmit,
  onCancel,
  isLoading,
}: ServiceFormProps) {
  const { colors } = useTheme()
  const { data: user } = useCurrentUser()
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    baseDurationMinutes: service?.baseDurationMinutes || 60,
    basePrice: service?.basePrice || 50,
    category: service?.category || 'bath',
    isActive: service?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      validationErrors.name = 'Service name is required'
    }
    if (formData.baseDurationMinutes <= 0) {
      validationErrors.baseDurationMinutes = 'Duration must be greater than 0'
    }
    if (formData.basePrice < 0) {
      validationErrors.basePrice = 'Price cannot be negative'
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    onSubmit({
      ...formData,
      organizationId: user?.organizationId || '',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Service Name"
        value={formData.name}
        onChange={(e) => {
          setFormData((p) => ({ ...p, name: e.target.value }))
          if (errors.name) setErrors((p) => ({ ...p, name: '' }))
        }}
        error={errors.name}
        required
      />
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
        rows={3}
      />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Input
          label="Base Duration (minutes)"
          type="number"
          value={formData.baseDurationMinutes}
          onChange={(e) => {
            setFormData((p) => ({ ...p, baseDurationMinutes: Number(e.target.value) }))
            if (errors.baseDurationMinutes) setErrors((p) => ({ ...p, baseDurationMinutes: '' }))
          }}
          error={errors.baseDurationMinutes}
          min={5}
          required
        />
        <Input
          label="Base Price ($)"
          type="number"
          value={formData.basePrice}
          onChange={(e) => {
            setFormData((p) => ({ ...p, basePrice: Number(e.target.value) }))
            if (errors.basePrice) setErrors((p) => ({ ...p, basePrice: '' }))
          }}
          error={errors.basePrice}
          min={0}
          step={0.01}
          required
        />
      </div>
      <Select
        label="Category"
        options={Object.entries(SERVICE_CATEGORIES).map(([value, label]) => ({ value, label }))}
        value={formData.category}
        onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as Service['category'] }))}
      />
      <Toggle
        label="Active"
        description="Inactive services won't appear in the booking portal"
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
          style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
        >
          {service ? 'Update' : 'Create'} Service
        </Button>
      </div>
    </form>
  )
}
