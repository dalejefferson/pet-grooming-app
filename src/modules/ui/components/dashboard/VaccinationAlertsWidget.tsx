import { Link } from 'react-router-dom'
import { AlertTriangle, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { Card, CardTitle, Badge } from '../common'
import { useExpiringVaccinations } from '@/modules/database/hooks'
import { formatDaysUntilExpiration } from '@/lib/utils/vaccinationUtils'
import { cn } from '@/lib/utils'
import type { VaccinationStatus } from '@/types'
import type { PetWithExpiringVaccinations } from '@/modules/database/hooks'

// ============================================
// Types
// ============================================

interface VaccinationAlert {
  petId: string
  petName: string
  clientName: string
  vaccinationName: string
  expirationDate: string
  status: VaccinationStatus
  daysUntilExpiration: number
}

interface GroupedAlerts {
  expired: VaccinationAlert[]
  expiring_7: VaccinationAlert[]
  expiring_30: VaccinationAlert[]
}

// ============================================
// Helper Functions
// ============================================

function getStatusIcon(status: VaccinationStatus) {
  switch (status) {
    case 'expired':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case 'expiring_7':
      return <AlertCircle className="h-4 w-4 text-orange-600" />
    case 'expiring_30':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    default:
      return <CheckCircle className="h-4 w-4 text-green-600" />
  }
}

function flattenAlerts(data: PetWithExpiringVaccinations[]): VaccinationAlert[] {
  const alerts: VaccinationAlert[] = []

  for (const item of data) {
    const clientName = item.client
      ? `${item.client.firstName} ${item.client.lastName}`
      : 'Unknown Client'

    for (const vax of item.vaccinations) {
      if (vax.status !== 'valid') {
        alerts.push({
          petId: item.pet.id,
          petName: item.pet.name,
          clientName,
          vaccinationName: vax.name,
          expirationDate: vax.expirationDate,
          status: vax.status,
          daysUntilExpiration: vax.daysUntilExpiration,
        })
      }
    }
  }

  return alerts
}

function groupAlertsBySeverity(alerts: VaccinationAlert[]): GroupedAlerts {
  return {
    expired: alerts.filter((a) => a.status === 'expired'),
    expiring_7: alerts.filter((a) => a.status === 'expiring_7'),
    expiring_30: alerts.filter((a) => a.status === 'expiring_30'),
  }
}

// ============================================
// Sub-components
// ============================================

interface AlertRowProps {
  alert: VaccinationAlert
}

function AlertRow({ alert }: AlertRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-[#1e293b] bg-white p-3 shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]">
      <div className="flex items-center gap-3">
        {getStatusIcon(alert.status)}
        <div>
          <Link
            to={`/app/pets/${alert.petId}`}
            className="font-medium text-[#1e293b] hover:underline"
          >
            {alert.petName}
          </Link>
          <p className="text-xs text-[#64748b]">{alert.clientName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-[#334155]">{alert.vaccinationName}</p>
        <p className="text-xs text-[#64748b]">
          {formatDaysUntilExpiration(alert.expirationDate)}
        </p>
      </div>
    </div>
  )
}

interface AlertGroupProps {
  title: string
  alerts: VaccinationAlert[]
  badgeClass: string
}

function AlertGroup({ title, alerts, badgeClass }: AlertGroupProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-lg border-2 border-[#1e293b] px-2 py-0.5 text-xs font-semibold shadow-[1px_1px_0px_0px_#1e293b]',
            badgeClass
          )}
        >
          {title}
        </span>
        <span className="text-sm text-[#64748b]">({alerts.length})</span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, idx) => (
          <AlertRow
            key={`${alert.petId}-${alert.vaccinationName}-${idx}`}
            alert={alert}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export interface VaccinationAlertsWidgetProps {
  className?: string
}

export function VaccinationAlertsWidget({ className }: VaccinationAlertsWidgetProps) {
  const { data: expiringVaccinations = [], isLoading } = useExpiringVaccinations(30)

  const alerts = flattenAlerts(expiringVaccinations)
  const grouped = groupAlertsBySeverity(alerts)
  const totalAlerts = alerts.length

  return (
    <Card className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#1e293b]" />
          <CardTitle>Vaccination Alerts</CardTitle>
        </div>
        {totalAlerts > 0 && (
          <Badge variant="danger" size="sm">
            {totalAlerts}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1e293b] border-t-transparent" />
        </div>
      ) : totalAlerts === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 rounded-full bg-green-100 p-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="font-medium text-[#334155]">All vaccinations up to date</p>
          <p className="text-sm text-[#64748b]">No alerts at this time</p>
        </div>
      ) : (
        <div className="max-h-[320px] space-y-4 overflow-y-auto">
          <AlertGroup
            title="Expired"
            alerts={grouped.expired}
            badgeClass="bg-red-100 text-red-800"
          />
          <AlertGroup
            title="Expiring in 7 days"
            alerts={grouped.expiring_7}
            badgeClass="bg-orange-100 text-orange-800"
          />
          <AlertGroup
            title="Expiring in 30 days"
            alerts={grouped.expiring_30}
            badgeClass="bg-yellow-100 text-yellow-800"
          />
        </div>
      )}
    </Card>
  )
}
