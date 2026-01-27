import { useState } from 'react'
import { Button, Input, Select, Toggle } from '@/components/common'
import type { ServiceModifier } from '@/types'

interface ModifierFormProps {
  onSubmit: (data: Omit<ServiceModifier, 'id' | 'serviceId'>) => void
  onCancel: () => void
  isLoading: boolean
}

export function ModifierForm({
  onSubmit,
  onCancel,
  isLoading,
}: ModifierFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'addon' as ServiceModifier['type'],
    durationMinutes: 15,
    priceAdjustment: 10,
    isPercentage: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Modifier Name"
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        placeholder="e.g., Large Dog, Dematting"
        required
      />
      <Select
        label="Type"
        options={[
          { value: 'weight', label: 'Weight-based' },
          { value: 'coat', label: 'Coat-based' },
          { value: 'breed', label: 'Breed-based' },
          { value: 'addon', label: 'Add-on Service' },
        ]}
        value={formData.type}
        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as ServiceModifier['type'] }))}
      />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Input
          label="Additional Duration (min)"
          type="number"
          value={formData.durationMinutes}
          onChange={(e) => setFormData((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
          min={0}
        />
        <Input
          label={formData.isPercentage ? 'Price Adjustment (%)' : 'Price Adjustment ($)'}
          type="number"
          value={formData.priceAdjustment}
          onChange={(e) => setFormData((p) => ({ ...p, priceAdjustment: Number(e.target.value) }))}
          min={0}
          step={formData.isPercentage ? 1 : 0.01}
        />
      </div>
      <Toggle
        label="Percentage-based pricing"
        description="Calculate price as a percentage of base price"
        checked={formData.isPercentage}
        onChange={(checked) => setFormData((p) => ({ ...p, isPercentage: checked }))}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] sm:min-h-0">
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} className="min-h-[44px] sm:min-h-0">
          Add Modifier
        </Button>
      </div>
    </form>
  )
}
