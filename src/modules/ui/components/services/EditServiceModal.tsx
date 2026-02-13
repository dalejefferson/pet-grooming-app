import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button, SubscriptionGate } from '../common'
import { useAddModifier, useRemoveModifier } from '@/hooks'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { ServiceForm } from './ServiceForm'
import { ModifierForm } from './ModifierForm'
import type { Service, ServiceModifier } from '@/types'

interface EditServiceModalProps {
  service: Service
  onSubmit: (data: Partial<Service>) => void
  onCancel: () => void
  onDelete: () => void
  isLoading: boolean
}

export function EditServiceModal({
  service,
  onSubmit,
  onCancel,
  onDelete,
  isLoading,
}: EditServiceModalProps) {
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
    <div className="space-y-6">
      <ServiceForm
        service={service}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
      />

      {/* Modifiers Section */}
      <SubscriptionGate feature="serviceModifiers">
        <div className="border-t pt-4">
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
                    aria-label={`Remove ${modifier.name} modifier`}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-danger-500" />
                  </Button>
                </div>
              ))}

              {showModifierForm ? (
                <div className="mt-4 rounded-xl border-2 border-[#1e293b] p-4">
                  <ModifierForm
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
      </SubscriptionGate>

      {/* Delete Service button */}
      <div className="border-t pt-4">
        <Button
          variant="outline"
          onClick={onDelete}
          className="w-full text-danger-600 border-danger-300 hover:bg-danger-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Service
        </Button>
      </div>
    </div>
  )
}
