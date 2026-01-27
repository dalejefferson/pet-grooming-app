import { Calendar, Clock, FileText, Edit2, Trash2 } from 'lucide-react'
import { Button, Badge } from '@/components/common'
import { format, parseISO, differenceInDays } from 'date-fns'
import type { VaccinationRecord } from '@/types'

// Calculate vaccination status
type VaxStatus = 'valid' | 'expiring' | 'expired'

function getVaccinationStatus(expirationDate: string): VaxStatus {
  const expDate = parseISO(expirationDate)
  const today = new Date()
  const daysUntilExpiration = differenceInDays(expDate, today)

  if (daysUntilExpiration < 0) return 'expired'
  if (daysUntilExpiration <= 30) return 'expiring'
  return 'valid'
}

function getDaysUntilExpiration(expirationDate: string): number {
  return differenceInDays(parseISO(expirationDate), new Date())
}

export interface VaccinationCardProps {
  vaccination: VaccinationRecord
  onEdit: (vax: VaccinationRecord) => void
  onDelete: (id: string) => void
}

export function VaccinationCard({ vaccination: vax, onEdit, onDelete }: VaccinationCardProps) {
  const status = getVaccinationStatus(vax.expirationDate)
  const daysUntil = getDaysUntilExpiration(vax.expirationDate)

  // Status-based styling
  const statusStyles = {
    valid: {
      border: 'border-l-[#22c55e]',
      bg: 'bg-[#f0fdf4]',
      badge: 'success' as const,
      badgeText: `${daysUntil} days left`,
    },
    expiring: {
      border: 'border-l-[#eab308]',
      bg: 'bg-[#fefce8]',
      badge: 'warning' as const,
      badgeText: daysUntil === 0 ? 'Expires today' : `${daysUntil} days left`,
    },
    expired: {
      border: 'border-l-[#ef4444]',
      bg: 'bg-[#fef2f2]',
      badge: 'danger' as const,
      badgeText: 'Expired',
    },
  }

  const style = statusStyles[status]

  return (
    <div
      className={`relative rounded-xl border-2 border-[#1e293b] border-l-4 ${style.border} ${style.bg} p-4 shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5`}
    >
      {/* Header with name and status badge */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-[#1e293b] text-base">{vax.name}</h4>
        <Badge variant={style.badge} size="sm">
          {style.badgeText}
        </Badge>
      </div>

      {/* Dates */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <Calendar className="h-3.5 w-3.5" />
          <span>Administered: {format(parseISO(vax.dateAdministered), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <Clock className="h-3.5 w-3.5" />
          <span>Expires: {format(parseISO(vax.expirationDate), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#e2e8f0]">
        {vax.documentUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newWindow = window.open()
              if (newWindow && vax.documentUrl) {
                const isPdf = vax.documentUrl.startsWith('data:application/pdf')
                if (isPdf) {
                  newWindow.document.write(`
                    <html>
                      <head><title>${vax.name} - Vaccination Document</title></head>
                      <body style="margin:0;padding:0;">
                        <iframe src="${vax.documentUrl}" style="width:100%;height:100vh;border:none;"></iframe>
                      </body>
                    </html>
                  `)
                } else {
                  newWindow.document.write(`
                    <html>
                      <head><title>${vax.name} - Vaccination Document</title></head>
                      <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1e293b;">
                        <img src="${vax.documentUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                      </body>
                    </html>
                  `)
                }
                newWindow.document.close()
              }
            }}
            className="text-[#22c55e] hover:text-[#16a34a]"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            View Doc
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(vax)}
          className="text-[#64748b] hover:text-[#1e293b]"
        >
          <Edit2 className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(vax.id)}
          className="text-[#64748b] hover:text-[#ef4444]"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}
