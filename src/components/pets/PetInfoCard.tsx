import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/common'
import { COAT_TYPE_LABELS, WEIGHT_RANGE_LABELS } from '@/config/constants'
import { format, parseISO } from 'date-fns'
import type { Pet, Client } from '@/types'

export interface PetInfoCardProps {
  pet: Pet
  client?: Client | null
}

export function PetInfoCard({ pet, client }: PetInfoCardProps) {
  return (
    <Card>
      <CardTitle>Basic Information</CardTitle>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm text-gray-500">Owner</dt>
          <dd className="font-medium text-gray-900">
            {client ? (
              <Link to={`/app/clients/${client.id}`} className="text-primary-600 hover:underline">
                {client.firstName} {client.lastName}
              </Link>
            ) : (
              'Unknown'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Weight</dt>
          <dd className="font-medium text-gray-900">
            {pet.weight > 0 ? `${pet.weight} lbs` : WEIGHT_RANGE_LABELS[pet.weightRange]}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Coat Type</dt>
          <dd className="font-medium text-gray-900">{COAT_TYPE_LABELS[pet.coatType]}</dd>
        </div>
        {pet.birthDate && (
          <div>
            <dt className="text-sm text-gray-500">Birth Date</dt>
            <dd className="font-medium text-gray-900">
              {format(parseISO(pet.birthDate), 'MMMM d, yyyy')}
            </dd>
          </div>
        )}
        {pet.lastGroomingDate && (
          <div>
            <dt className="text-sm text-gray-500">Last Grooming</dt>
            <dd className="font-medium text-gray-900">
              {format(parseISO(pet.lastGroomingDate), 'MMMM d, yyyy')}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  )
}
