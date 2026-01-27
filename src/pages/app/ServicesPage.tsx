import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button, Badge, Modal, Input, Select, Textarea, Toggle } from '@/components/common'
import { useServices, useCreateService, useUpdateService, useDeleteService, useAddModifier, useRemoveModifier } from '@/hooks'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'
import { SERVICE_CATEGORIES } from '@/config/constants'
import type { Service, ServiceModifier } from '@/types'
import { useTheme } from '@/context/ThemeContext'

function ServiceForm({
  service,
  onSubmit,
  onCancel,
  isLoading,
}: {
  service?: Service
  onSubmit: (data: Partial<Service>) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    baseDurationMinutes: service?.baseDurationMinutes || 60,
    basePrice: service?.basePrice || 50,
    category: service?.category || 'bath',
    isActive: service?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      organizationId: 'org-1',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Service Name"
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        required
      />
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
        rows={3}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Base Duration (minutes)"
          type="number"
          value={formData.baseDurationMinutes}
          onChange={(e) => setFormData((p) => ({ ...p, baseDurationMinutes: Number(e.target.value) }))}
          min={5}
          required
        />
        <Input
          label="Base Price ($)"
          type="number"
          value={formData.basePrice}
          onChange={(e) => setFormData((p) => ({ ...p, basePrice: Number(e.target.value) }))}
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
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {service ? 'Update' : 'Create'} Service
        </Button>
      </div>
    </form>
  )
}

function ModifierForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  serviceId: string
  onSubmit: (data: Omit<ServiceModifier, 'id' | 'serviceId'>) => void
  onCancel: () => void
  isLoading: boolean
}) {
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Add Modifier
        </Button>
      </div>
    </form>
  )
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showModifierForm, setShowModifierForm] = useState(false)
  const addModifier = useAddModifier()
  const removeModifier = useRemoveModifier()

  const handleAddModifier = async (data: Omit<ServiceModifier, 'id' | 'serviceId'>) => {
    await addModifier.mutateAsync({ serviceId: service.id, modifier: data })
    setShowModifierForm(false)
  }

  const handleRemoveModifier = async (modifierId: string) => {
    await removeModifier.mutateAsync({ serviceId: service.id, modifierId })
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            {!service.isActive && (
              <Badge variant="secondary" size="sm">Inactive</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{service.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" size="sm">
              {SERVICE_CATEGORIES[service.category]}
            </Badge>
            <Badge variant="primary" size="sm">
              {formatDuration(service.baseDurationMinutes)}
            </Badge>
            <Badge variant="success" size="sm">
              {formatCurrency(service.basePrice)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-danger-500" />
          </Button>
        </div>
      </div>

      {/* Modifiers Section */}
      <div className="mt-4 border-t pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-700"
        >
          <span>Modifiers ({service.modifiers.length})</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {service.modifiers.map((modifier) => (
              <div
                key={modifier.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-gray-900">{modifier.name}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    +{formatDuration(modifier.durationMinutes)}, +
                    {modifier.isPercentage
                      ? `${modifier.priceAdjustment}%`
                      : formatCurrency(modifier.priceAdjustment)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveModifier(modifier.id)}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            ))}

            {showModifierForm ? (
              <div className="mt-4 rounded-lg border border-gray-200 p-4">
                <ModifierForm
                  serviceId={service.id}
                  onSubmit={handleAddModifier}
                  onCancel={() => setShowModifierForm(false)}
                  isLoading={addModifier.isPending}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModifierForm(true)}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Modifier
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function ServicesPage() {
  const { colors } = useTheme()
  const { data: services = [], isLoading } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const handleCreate = async (data: Partial<Service>) => {
    await createService.mutateAsync(data as Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>)
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: Partial<Service>) => {
    if (editingService) {
      await updateService.mutateAsync({ id: editingService.id, data })
      setEditingService(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService.mutateAsync(id)
    }
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className={cn('min-h-full', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading services...</div>
      ) : services.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-gray-600">No services yet. Create your first service to get started.</p>
          </div>
        </Card>
      ) : (
        Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category}>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => setEditingService(service)}
                  onDelete={() => handleDelete(service.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Service"
        size="md"
      >
        <ServiceForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createService.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title="Edit Service"
        size="md"
      >
        {editingService && (
          <ServiceForm
            service={editingService}
            onSubmit={handleUpdate}
            onCancel={() => setEditingService(null)}
            isLoading={updateService.isPending}
          />
        )}
      </Modal>
      </div>
    </div>
  )
}
