import { AlertTriangle } from 'lucide-react'
import { Card, CardTitle } from '@/components/common'
import type { Pet } from '@/types'

export interface MedicalNotesCardProps {
  pet: Pet
}

export function MedicalNotesCard({ pet }: MedicalNotesCardProps) {
  if (!pet.medicalNotes) {
    return null
  }

  return (
    <Card className="border-warning-200 bg-warning-50">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning-600" />
        <CardTitle>Medical Notes</CardTitle>
      </div>
      <p className="mt-4 text-gray-700">{pet.medicalNotes}</p>
    </Card>
  )
}
