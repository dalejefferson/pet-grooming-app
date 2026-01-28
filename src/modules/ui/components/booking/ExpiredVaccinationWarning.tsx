import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../common'
import { formatDaysUntilExpiration } from '@/lib/utils/vaccinationUtils'
import type { VaccinationRecord } from '@/types'

export interface ExpiredVaccinationWarningProps {
  petName: string
  petId?: string
  expiredVaccinations: VaccinationRecord[]
  onUpdateVaccinations?: () => void
}

/**
 * ExpiredVaccinationWarning - Shows a warning card when pet has expired vaccinations
 * Displays expired vaccination names with how long ago they expired
 * Neo-brutalist styling with red background
 */
export function ExpiredVaccinationWarning({
  petName,
  petId,
  expiredVaccinations,
  onUpdateVaccinations,
}: ExpiredVaccinationWarningProps) {
  const navigate = useNavigate()

  const handleUpdateClick = () => {
    if (onUpdateVaccinations) {
      onUpdateVaccinations()
    } else if (petId) {
      // Navigate to pet detail page to update vaccinations
      navigate(`/app/pets/${petId}`)
    }
  }

  if (expiredVaccinations.length === 0) {
    return null
  }

  return (
    <Card className="border-red-300 bg-red-50">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#1e293b] bg-red-100 shadow-[2px_2px_0px_0px_#1e293b]">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-red-900">
            Expired Vaccinations for {petName}
          </h3>
          <p className="mt-1 text-sm text-red-800">
            The following vaccinations have expired and must be updated before booking:
          </p>
          <ul className="mt-2 space-y-1">
            {expiredVaccinations.map((vax) => (
              <li
                key={vax.id}
                className="flex items-center gap-2 text-sm text-red-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="font-medium">{vax.name}</span>
                <span className="text-red-600">
                  ({formatDaysUntilExpiration(vax.expirationDate)})
                </span>
              </li>
            ))}
          </ul>
          {(onUpdateVaccinations || petId) && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleUpdateClick}
              className="mt-3"
            >
              Update Vaccinations
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
