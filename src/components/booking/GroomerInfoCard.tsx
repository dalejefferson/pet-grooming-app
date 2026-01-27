import { Users } from 'lucide-react'
import type { Groomer } from '@/types'

interface GroomerInfoCardProps {
  groomer: Groomer | null
}

export function GroomerInfoCard({ groomer }: GroomerInfoCardProps) {
  return (
    <div className="flex items-start gap-4 border-t pt-4">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-accent-100">
        {groomer ? (
          groomer.imageUrl ? (
            <img
              src={groomer.imageUrl}
              alt={`${groomer.firstName} ${groomer.lastName}`}
              className="h-12 w-12 object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-accent-700">
              {groomer.firstName[0]}
              {groomer.lastName[0]}
            </span>
          )
        ) : (
          <Users className="h-6 w-6 text-accent-600" />
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500">Your Groomer</p>
        <p className="font-medium text-gray-900">
          {groomer
            ? `${groomer.firstName} ${groomer.lastName}`
            : 'First Available Groomer'}
        </p>
        {groomer && groomer.specialties.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {groomer.specialties.slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
