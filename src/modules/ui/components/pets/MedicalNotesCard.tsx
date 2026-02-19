import { useState } from 'react'
import { AlertTriangle, Edit2 } from 'lucide-react'
import { Card, CardTitle, Button, Textarea } from '../common'
import { useTheme } from '../../context'
import { NOTES_MAX_LENGTH } from '@/lib/utils/validation'
import type { Pet } from '@/types'

export interface MedicalNotesCardProps {
  pet: Pet
  onSaveMedicalNotes?: (notes: string) => Promise<void>
  isSaving?: boolean
}

export function MedicalNotesCard({ pet, onSaveMedicalNotes, isSaving }: MedicalNotesCardProps) {
  const { colors } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState('')

  const handleStartEditing = () => {
    setNotes(pet.medicalNotes || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!onSaveMedicalNotes) return
    await onSaveMedicalNotes(notes)
    setIsEditing(false)
  }

  const hasNotes = !!pet.medicalNotes

  return (
    <Card className={hasNotes ? 'border-warning-200 bg-warning-50' : undefined}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasNotes && <AlertTriangle className="h-5 w-5 text-warning-600" />}
          <CardTitle>Medical Notes</CardTitle>
        </div>
        {!isEditing && onSaveMedicalNotes && (
          <Button variant="ghost" size="sm" onClick={handleStartEditing}>
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
            maxLength={NOTES_MAX_LENGTH}
            placeholder="Enter any medical notes, allergies, or health conditions..."
          />
          <p className={`mt-1 text-right text-xs ${notes.length > NOTES_MAX_LENGTH - 20 ? 'text-red-500' : 'text-[#64748b]'}`}>
            {notes.length}/{NOTES_MAX_LENGTH}
          </p>
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
          {pet.medicalNotes || 'No medical notes yet.'}
        </p>
      )}
    </Card>
  )
}
