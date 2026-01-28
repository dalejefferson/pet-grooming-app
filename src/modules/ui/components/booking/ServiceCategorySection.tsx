import { Card, CardTitle } from '../common'
import { SERVICE_CATEGORIES } from '@/config/constants'
import { ServiceCard } from './ServiceCard'
import type { Service } from '@/types'

interface ServiceCategorySectionProps {
  category: string
  services: Service[]
  isServiceSelected: (serviceId: string) => boolean
  isModifierSelected: (serviceId: string, modifierId: string) => boolean
  onToggleService: (serviceId: string) => void
  onToggleModifier: (serviceId: string, modifierId: string) => void
}

export function ServiceCategorySection({
  category,
  services,
  isServiceSelected,
  isModifierSelected,
  onToggleService,
  onToggleModifier,
}: ServiceCategorySectionProps) {
  return (
    <Card>
      <CardTitle>{SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]}</CardTitle>
      <div className="mt-4 space-y-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={isServiceSelected(service.id)}
            isModifierSelected={isModifierSelected}
            onToggleService={onToggleService}
            onToggleModifier={onToggleModifier}
          />
        ))}
      </div>
    </Card>
  )
}
