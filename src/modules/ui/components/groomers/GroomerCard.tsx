import { Trash2, Phone } from 'lucide-react'
import { Card, Badge } from '../common'
import { formatPhone } from '@/lib/utils'
import { useTheme } from '../../context'
import type { Groomer } from '@/types'

interface GroomerCardProps {
  groomer: Groomer
  onEdit: () => void
  onDelete: () => void
}

export function GroomerCard({
  groomer,
  onEdit,
  onDelete,
}: GroomerCardProps) {
  const { colors } = useTheme()
  const initials = `${groomer.firstName.charAt(0)}${groomer.lastName.charAt(0)}`

  const handleCardClick = () => {
    onEdit()
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <Card
      colorVariant={groomer.isActive ? 'white' : 'lemon'}
      className="aspect-square flex flex-col items-center justify-center p-4 text-center relative cursor-pointer hover:shadow-[4px_4px_0px_0px_#1e293b] transition-shadow"
      onClick={handleCardClick}
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-1.5 right-1.5 p-1 rounded-lg hover:bg-red-50 transition-colors"
        aria-label="Delete groomer"
      >
        <Trash2 className="h-3.5 w-3.5 text-danger-500" />
      </button>

      {/* Profile Image or Initials */}
      {groomer.imageUrl ? (
        <img
          src={groomer.imageUrl}
          alt={`${groomer.firstName} ${groomer.lastName}`}
          className="h-20 w-20 rounded-2xl border-2 border-[#1e293b] object-cover shadow-[3px_3px_0px_0px_#1e293b]"
        />
      ) : (
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1e293b] text-2xl font-bold text-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b]"
          style={{ backgroundColor: colors.accentColor }}
        >
          {initials}
        </div>
      )}

      {/* Name */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <h3 className="font-semibold text-gray-900">
          {groomer.firstName} {groomer.lastName}
        </h3>
        {!groomer.isActive && (
          <Badge variant="secondary" size="sm">Inactive</Badge>
        )}
      </div>

      {/* Contact */}
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <div className="flex items-center justify-center gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          {formatPhone(groomer.phone)}
        </div>
      </div>

      {/* Specialties */}
      {groomer.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {groomer.specialties.slice(0, 2).map((specialty) => (
            <Badge key={specialty} variant="outline" size="sm">
              {specialty}
            </Badge>
          ))}
          {groomer.specialties.length > 2 && (
            <Badge variant="secondary" size="sm">
              +{groomer.specialties.length - 2}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}
