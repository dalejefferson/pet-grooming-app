import { Check } from 'lucide-react'
import { Badge } from '../common'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { Service } from '@/types'

interface ServiceCardProps {
  service: Service
  isSelected: boolean
  isModifierSelected: (serviceId: string, modifierId: string) => boolean
  onToggleService: (serviceId: string) => void
  onToggleModifier: (serviceId: string, modifierId: string) => void
}

export function ServiceCard({
  service,
  isSelected,
  isModifierSelected,
  onToggleService,
  onToggleModifier,
}: ServiceCardProps) {
  return (
    <div>
      <button
        onClick={() => onToggleService(service.id)}
        className={`flex w-full items-center justify-between rounded-xl border-2 border-[#1e293b] p-4 text-left transition-all cursor-pointer ${
          isSelected
            ? 'bg-primary-100 shadow-[3px_3px_0px_0px_#1e293b] -translate-x-0.5 -translate-y-0.5'
            : 'bg-white shadow-[2px_2px_0px_0px_#1e293b] hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-x-0.5 hover:-translate-y-0.5'
        }`}
      >
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{service.name}</p>
          <p className="text-sm text-gray-600">{service.description}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline" size="sm">
              {formatDuration(service.baseDurationMinutes)}
            </Badge>
            <Badge variant="primary" size="sm">
              {formatCurrency(service.basePrice)}
            </Badge>
          </div>
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#1e293b] transition-colors ${
          isSelected ? 'bg-primary-500' : 'bg-white'
        }`}>
          {isSelected && <Check className="h-4 w-4 text-white" />}
        </div>
      </button>

      {/* Modifiers */}
      {isSelected && service.modifiers.length > 0 && (
        <div className="ml-4 mt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add-ons</p>
          {service.modifiers.map((modifier) => (
            <button
              key={modifier.id}
              onClick={() => onToggleModifier(service.id, modifier.id)}
              className={`flex w-full items-center justify-between rounded-lg border-2 border-[#1e293b] px-3 py-2 text-left text-sm transition-all cursor-pointer ${
                isModifierSelected(service.id, modifier.id)
                  ? 'bg-primary-50 shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-white shadow-[1px_1px_0px_0px_#1e293b] hover:shadow-[2px_2px_0px_0px_#1e293b]'
              }`}
            >
              <div>
                <span className="font-medium text-gray-900">{modifier.name}</span>
                <span className="ml-2 text-gray-600">
                  +{formatDuration(modifier.durationMinutes)}, +
                  {modifier.isPercentage
                    ? `${modifier.priceAdjustment}%`
                    : formatCurrency(modifier.priceAdjustment)}
                </span>
              </div>
              <div className={`flex h-5 w-5 items-center justify-center rounded border-2 border-[#1e293b] transition-colors ${
                isModifierSelected(service.id, modifier.id) ? 'bg-primary-500' : 'bg-white'
              }`}>
                {isModifierSelected(service.id, modifier.id) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
