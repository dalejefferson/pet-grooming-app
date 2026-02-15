import { useNavigate } from 'react-router-dom'
import { Phone, Trash2 } from 'lucide-react'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { formatPhone } from '@/lib/utils'
import { useTheme } from '../../context'
import type { Groomer } from '@/types'

export interface StaffCardProps {
  staff: Groomer
  onClick?: () => void
  onDelete?: () => void
}

const ROLE_BADGES: Record<
  Groomer['role'],
  { color: string; bgColor: string; label: string }
> = {
  owner: {
    color: 'text-[#b45309]',
    bgColor: 'bg-[#fde68a]',
    label: 'Owner',
  },
  admin: {
    color: 'text-[#7c3aed]',
    bgColor: 'bg-[#e9d5ff]',
    label: 'Admin',
  },
  groomer: {
    color: 'text-[#2563eb]',
    bgColor: 'bg-[#bfdbfe]',
    label: 'Groomer',
  },
  receptionist: {
    color: 'text-[#16a34a]',
    bgColor: 'bg-[#d1fae5]',
    label: 'Receptionist',
  },
}

export function StaffCard({ staff, onClick, onDelete }: StaffCardProps) {
  const navigate = useNavigate()
  const { colors } = useTheme()

  const initials = `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`
  const roleBadge = ROLE_BADGES[staff.role] ?? {
    color: 'text-[#64748b]',
    bgColor: 'bg-[#f1f5f9]',
    label: staff.role ?? 'Unknown',
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(`/app/staff/${staff.id}`)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <Card
      colorVariant={staff.isActive ? 'white' : 'lemon'}
      className="relative group flex cursor-pointer flex-col items-center justify-center p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]"
      onClick={handleClick}
    >
      {/* Delete Button - Top Right */}
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          aria-label="Delete staff member"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      )}

      {/* Profile Image or Initials */}
      <div className="relative">
        {staff.imageUrl ? (
          <img
            src={staff.imageUrl}
            alt={`${staff.firstName} ${staff.lastName}`}
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

        {/* Status indicator */}
        <div
          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#1e293b] ${
            staff.isActive ? 'bg-[#22c55e]' : 'bg-[#94a3b8]'
          }`}
          title={staff.isActive ? 'Active' : 'Inactive'}
        />
      </div>

      {/* Name */}
      <h3 className="mt-3 font-semibold text-[#1e293b]">
        {staff.firstName} {staff.lastName}
      </h3>

      {/* Role Badge */}
      <div
        className={`mt-1.5 inline-flex items-center rounded-lg border-2 border-[#1e293b] px-2 py-0.5 text-xs font-semibold shadow-[2px_2px_0px_0px_#1e293b] ${roleBadge.bgColor} ${roleBadge.color}`}
      >
        {roleBadge.label}
      </div>

      {/* Contact */}
      <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-[#64748b]">
        <Phone className="h-3.5 w-3.5" />
        {formatPhone(staff.phone)}
      </div>

      {/* Specialties */}
      {staff.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {staff.specialties.slice(0, 2).map((specialty) => (
            <Badge key={specialty} variant="outline" size="sm">
              {specialty}
            </Badge>
          ))}
          {staff.specialties.length > 2 && (
            <Badge variant="secondary" size="sm">
              +{staff.specialties.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Inactive status */}
      {!staff.isActive && (
        <Badge variant="warning" size="sm" className="mt-2">
          Inactive
        </Badge>
      )}
    </Card>
  )
}
