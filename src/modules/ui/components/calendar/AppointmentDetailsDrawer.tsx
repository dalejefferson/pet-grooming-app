import { format } from 'date-fns'
import { AlertTriangle, UserX, XCircle, Trash2 } from 'lucide-react'
import { Drawer, Badge, Select, Button } from '../common'
import { APPOINTMENT_STATUS_LABELS } from '@/config/constants'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'
import { STATUS_BG_COLORS, STATUS_BORDER_COLORS } from './types'
import type { AppointmentStatus, PaymentStatus, Pet } from '@/types'
import type { AppointmentDetailsDrawerProps } from './types'
import { usePermissions } from '@/modules/auth/hooks/usePermissions'
import { useUpdatePaymentStatus } from '@/modules/database/hooks/useCalendar'
import { VALID_TRANSITIONS } from '@/modules/database/api/statusMachine'

function getStatusOptions(currentStatus: AppointmentStatus) {
  const validNext = VALID_TRANSITIONS[currentStatus]
  const options = [
    { value: currentStatus, label: APPOINTMENT_STATUS_LABELS[currentStatus] },
    ...validNext.map((status) => ({ value: status, label: APPOINTMENT_STATUS_LABELS[status] })),
  ]
  return options
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

const paymentStatusOptions = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/**
 * AppointmentDetailsDrawer displays detailed appointment information
 * in a side drawer with status management controls.
 */
export function AppointmentDetailsDrawer({
  appointment,
  onClose,
  clients,
  pets,
  groomers,
  onStatusChange,
  onQuickStatusChange,
  onDelete,
  isDeleting,
}: AppointmentDetailsDrawerProps) {
  const { isAdmin } = usePermissions()
  const updatePaymentStatus = useUpdatePaymentStatus()

  const selectedClient = appointment
    ? clients.find((c) => c.id === appointment.clientId)
    : null

  const selectedPets = appointment
    ? appointment.pets.map((p) => pets.find((pet) => pet.id === p.petId)).filter(Boolean) as Pet[]
    : []

  const selectedGroomer = appointment?.groomerId
    ? groomers.find((g) => g.id === appointment.groomerId)
    : null

  return (
    <Drawer
      isOpen={!!appointment}
      onClose={onClose}
      title="Appointment Details"
      size="md"
    >
      {appointment && (
        <div className="space-y-6">
          {/* Status with color indicator */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full border-2"
                style={{
                  backgroundColor: STATUS_BG_COLORS[appointment.status],
                  borderColor: STATUS_BORDER_COLORS[appointment.status],
                }}
              />
              <Select
                options={getStatusOptions(appointment.status)}
                value={appointment.status}
                onChange={(e) => onStatusChange(e.target.value as AppointmentStatus)}
                className="flex-1"
                disabled={VALID_TRANSITIONS[appointment.status].length === 0}
              />
            </div>

            {/* Quick Action Buttons for No Show / Canceled */}
            {appointment.status !== 'no_show' && appointment.status !== 'cancelled' && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickStatusChange('no_show')}
                  className="flex-1 border-[#f472b6] bg-[#fce7f3] text-[#9d174d] shadow-[2px_2px_0px_0px_#9d174d] hover:shadow-[3px_3px_0px_0px_#9d174d] active:shadow-[1px_1px_0px_0px_#9d174d]"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  No Show
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickStatusChange('cancelled')}
                  className="flex-1 border-[#9ca3af] bg-[#e5e7eb] text-[#374151] shadow-[2px_2px_0px_0px_#374151] hover:shadow-[3px_3px_0px_0px_#374151] active:shadow-[1px_1px_0px_0px_#374151]"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Canceled
                </Button>
              </div>
            )}

            {/* Display status notes if they exist */}
            {appointment.statusNotes && (appointment.status === 'no_show' || appointment.status === 'cancelled') && (
              <div className="mt-3 rounded-xl border-2 border-[#fbbf24] bg-[#fef9c3] p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#854d0e] mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#854d0e] uppercase mb-1">
                      {appointment.status === 'no_show' ? 'No Show Notes' : 'Cancellation Notes'}
                    </p>
                    <p className="text-sm text-[#92400e]">{appointment.statusNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">Time</h3>
            <p className="text-gray-900">
              {format(new Date(appointment.startTime), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-gray-600">
              {format(new Date(appointment.startTime), 'h:mm a')} -{' '}
              {format(new Date(appointment.endTime), 'h:mm a')}
            </p>
          </div>

          {/* Client */}
          {selectedClient && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Client</h3>
              <p className="text-gray-900">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedClient.email}</p>
              <p className="text-sm text-gray-600">{selectedClient.phone}</p>
            </div>
          )}

          {/* Groomer */}
          {selectedGroomer && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Groomer</h3>
              <p className="text-gray-900">{selectedGroomer.firstName} {selectedGroomer.lastName}</p>
            </div>
          )}

          {/* Pets & Services */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">Pets & Services</h3>
            <div className="space-y-3">
              {appointment.pets.map((aptPet, index) => {
                const pet = selectedPets[index]
                return (
                  <div key={aptPet.petId} className="rounded-xl border-2 border-[#1e293b] bg-[#fef9c3]/30 p-3 shadow-[2px_2px_0px_0px_#1e293b]">
                    <p className="font-semibold text-gray-900">
                      {pet?.name || 'Unknown Pet'}
                    </p>
                    {pet && (
                      <p className="text-sm text-gray-600">
                        {pet.breed} - {pet.species}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {aptPet.services.map((service, sIdx) => (
                        <div key={sIdx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Service ({formatDuration(service.finalDuration)})
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(service.finalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          {(appointment.internalNotes || appointment.clientNotes) && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Notes</h3>
              {appointment.internalNotes && (
                <div className="mb-2">
                  <Badge variant="secondary" size="sm">Internal</Badge>
                  <p className="mt-1 text-sm text-gray-600">
                    {appointment.internalNotes}
                  </p>
                </div>
              )}
              {appointment.clientNotes && (
                <div>
                  <Badge variant="outline" size="sm">Client</Badge>
                  <p className="mt-1 text-sm text-gray-600">
                    {appointment.clientNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="border-t-2 border-[#1e293b] pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Deposit</span>
              <span className={cn(
                appointment.depositPaid ? 'text-success-600 font-medium' : 'text-gray-900'
              )}>
                {appointment.depositAmount
                  ? `${formatCurrency(appointment.depositAmount)} ${appointment.depositPaid ? '(Paid)' : '(Pending)'}`
                  : 'None'}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-primary-600">
                {formatCurrency(appointment.totalAmount)}
              </span>
            </div>

            {/* Payment Status - Admin only */}
            {isAdmin && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Status
                </label>
                <Select
                  options={paymentStatusOptions}
                  value={appointment.paymentStatus || 'pending'}
                  onChange={(e) =>
                    updatePaymentStatus.mutate({
                      id: appointment.id,
                      paymentStatus: e.target.value as PaymentStatus,
                    })
                  }
                  disabled={updatePaymentStatus.isPending}
                />
              </div>
            )}
          </div>

          {/* Delete Button */}
          {onDelete && (
            <div className="border-t-2 border-[#1e293b] pt-4">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(appointment.id)}
                disabled={isDeleting}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Appointment'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
