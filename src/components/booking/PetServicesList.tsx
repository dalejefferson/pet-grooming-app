import { Dog } from 'lucide-react'
import { Card, CardTitle } from '@/components/common'
import { formatCurrency, formatDuration } from '@/lib/utils'

export interface PetServiceSummary {
  name: string
  services: {
    name: string
    duration: number
    price: number
  }[]
}

interface PetServicesListProps {
  petSummaries: PetServiceSummary[]
}

export function PetServicesList({ petSummaries }: PetServicesListProps) {
  return (
    <Card>
      <CardTitle>Services</CardTitle>
      <div className="mt-4 space-y-4">
        {petSummaries.map((pet, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Dog className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">{pet.name}</span>
            </div>
            <div className="space-y-2">
              {pet.services.map((service, sIndex) => (
                <div key={sIndex} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {service.name} ({formatDuration(service.duration)})
                  </span>
                  <span className="text-gray-900">{formatCurrency(service.price)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
