import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, AlertCircle, CheckCircle, Shield, Mail } from 'lucide-react'
import { Card, CardTitle, Badge } from '../common'
import { useExpiringVaccinations, useOrganization } from '@/hooks'
import { useToast } from '@/modules/ui/context'
import { useSendVaccinationReminderEmail, usePendingReminders } from '@/modules/database/hooks'
import { emailApi } from '@/modules/database/api'
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
  clientId: string
  clientName: string
  clientEmail?: string
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
          clientId: item.client?.id || '',
          clientName,
          clientEmail: item.client?.email,
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
  clientEmail?: string
  onSendEmail?: (alert: VaccinationAlert) => void
  isSending?: boolean
}

function AlertRow({ alert, clientEmail, onSendEmail, isSending }: AlertRowProps) {
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
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-medium text-[#334155]">{alert.vaccinationName}</p>
          <p className="text-xs text-[#64748b]">
            {formatDaysUntilExpiration(alert.expirationDate)}
          </p>
        </div>
        {clientEmail && onSendEmail && (
          <button
            onClick={(e) => { e.preventDefault(); onSendEmail(alert) }}
            disabled={isSending}
            className="rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-xs font-medium shadow-[1px_1px_0px_0px_#1e293b] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1e293b] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Mail className="h-3 w-3" />
            Email
          </button>
        )}
      </div>
    </div>
  )
}

interface AlertGroupProps {
  title: string
  alerts: VaccinationAlert[]
  badgeClass: string
  clientEmails: Record<string, string>
  onSendEmail?: (alert: VaccinationAlert) => void
  sendingAlertId?: string | null
}

function AlertGroup({ title, alerts, badgeClass, clientEmails, onSendEmail, sendingAlertId }: AlertGroupProps) {
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
            clientEmail={clientEmails[alert.petId]}
            onSendEmail={onSendEmail}
            isSending={sendingAlertId === `${alert.petId}-${alert.vaccinationName}`}
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
  const { data: organization } = useOrganization()
  const { showSuccess, showError } = useToast()
  const sendVaccinationEmail = useSendVaccinationReminderEmail()
  const { data: pendingReminders = [] } = usePendingReminders()
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null)

  const alerts = flattenAlerts(expiringVaccinations)
  const grouped = groupAlertsBySeverity(alerts)
  const totalAlerts = alerts.length

  // Build client email lookup
  const clientEmails: Record<string, string> = {}
  for (const alert of alerts) {
    if (alert.clientEmail) {
      clientEmails[alert.petId] = alert.clientEmail
    }
  }

  const handleSendEmail = async (alert: VaccinationAlert) => {
    if (!alert.clientEmail) return
    const alertId = `${alert.petId}-${alert.vaccinationName}`
    setSendingAlertId(alertId)

    // Find or create a reminder for this alert
    const existingReminder = pendingReminders.find(
      (r) => r.petId === alert.petId && r.vaccinationName === alert.vaccinationName
    )

    try {
      const urgency = alert.status === 'expired' ? 'expired' : alert.status === 'expiring_7' ? '7_day' : '30_day'
      const emailParams = {
        to: alert.clientEmail,
        clientName: alert.clientName.split(' ')[0],
        petName: alert.petName,
        vaccinationName: alert.vaccinationName,
        expirationDate: alert.expirationDate,
        urgency,
        businessName: organization?.name || 'Sit Pretty Club',
        replyTo: organization?.emailSettings?.replyToEmail || organization?.email,
        senderName: organization?.emailSettings?.senderDisplayName || organization?.name,
      } as const

      if (existingReminder) {
        // Send email and mark reminder as sent
        await sendVaccinationEmail.mutateAsync({
          reminderId: existingReminder.id,
          ...emailParams,
        })
      } else {
        // No pending reminder — send email directly without tracking
        await emailApi.sendVaccinationReminderEmail(emailParams)
      }

      showSuccess(`Vaccination alert sent to ${alert.clientEmail}`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send vaccination alert')
    } finally {
      setSendingAlertId(null)
    }
  }

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
            clientEmails={clientEmails}
            onSendEmail={handleSendEmail}
            sendingAlertId={sendingAlertId}
          />
          <AlertGroup
            title="Expiring in 7 days"
            alerts={grouped.expiring_7}
            badgeClass="bg-orange-100 text-orange-800"
            clientEmails={clientEmails}
            onSendEmail={handleSendEmail}
            sendingAlertId={sendingAlertId}
          />
          <AlertGroup
            title="Expiring in 30 days"
            alerts={grouped.expiring_30}
            badgeClass="bg-yellow-100 text-yellow-800"
            clientEmails={clientEmails}
            onSendEmail={handleSendEmail}
            sendingAlertId={sendingAlertId}
          />
        </div>
      )}
    </Card>
  )
}
