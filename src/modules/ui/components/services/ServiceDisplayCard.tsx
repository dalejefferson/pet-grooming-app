import { Trash2, Clock, DollarSign, Tag } from 'lucide-react'
import { Card, Badge } from '../common'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { SERVICE_CATEGORIES } from '@/config/constants'
import { useTheme } from '../../context'
import type { Service } from '@/types'

interface ServiceDisplayCardProps {
  service: Service
  onEdit: () => void
  onDelete: (e: React.MouseEvent) => void
}

export function ServiceDisplayCard({
  service,
  onEdit,
  onDelete,
}: ServiceDisplayCardProps) {
  const { colors } = useTheme()

  return (
    <Card
      className="aspect-square flex flex-col items-center justify-center p-4 text-center transition-all hover:shadow-[4px_4px_0px_0px_#1e293b] hover:-translate-y-1 cursor-pointer relative group"
      onClick={onEdit}
    >
      {/* Delete button in corner */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-50"
        title="Delete service"
      >
        <Trash2 className="h-4 w-4 text-danger-500" />
      </button>

      {/* Service Icon/Initial */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#1e293b] text-2xl font-bold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b]"
        style={{ backgroundColor: service.isActive ? colors.accentColor : '#e5e7eb' }}
      >
        <span>{service.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Service Name */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <h3 className="font-semibold text-gray-900 truncate max-w-full">{service.name}</h3>
        {!service.isActive && (
          <Badge variant="secondary" size="sm">Inactive</Badge>
        )}
      </div>

      {/* Price */}
      <div className="mt-2 flex items-center justify-center gap-1 text-lg font-bold text-success-600">
        <DollarSign className="h-4 w-4" />
        <span>{formatCurrency(service.basePrice).replace('$', '')}</span>
      </div>

      {/* Duration */}
      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-600">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDuration(service.baseDurationMinutes)}</span>
      </div>

      {/* Category Badge */}
      <div className="mt-3">
        <Badge variant="outline" size="sm">
          <Tag className="mr-1 h-3 w-3" />
          {SERVICE_CATEGORIES[service.category]}
        </Badge>
      </div>

      {/* Modifiers count */}
      {service.modifiers.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {service.modifiers.length} modifier{service.modifiers.length !== 1 ? 's' : ''}
        </p>
      )}
    </Card>
  )
}
