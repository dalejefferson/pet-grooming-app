import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { Card, CardTitle, Button, Textarea } from '../common'
import { useTheme } from '../../context'
import type { Pet } from '@/types'

export interface GroomingNotesCardProps {
  pet: Pet
  onSaveNotes: (notes: string) => Promise<void>
  isSaving: boolean
}

export function GroomingNotesCard({ pet, onSaveNotes, isSaving }: GroomingNotesCardProps) {
  const { colors } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    await onSaveNotes(notes)
    setIsEditing(false)
  }

  const handleStartEditing = () => {
    setNotes(pet.groomingNotes || '')
    setIsEditing(true)
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Grooming Notes</CardTitle>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEditing}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="mt-4 space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
              className="hover:opacity-90"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-gray-700">
          {pet.groomingNotes || 'No grooming notes yet.'}
        </p>
      )}
    </Card>
  )
}
