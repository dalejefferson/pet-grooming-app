import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Calendar, Plus, Check, X, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Textarea } from '../common/Textarea'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { NOTES_MAX_LENGTH } from '@/lib/utils/validation'
import {
  useTimeOffRequests,
  useCreateTimeOffRequest,
  useUpdateTimeOffRequest,
  useDeleteTimeOffRequest,
} from '@/modules/database/hooks'
import type { TimeOffRequest } from '@/types'

export interface TimeOffManagerProps {
  staffId: string
  isAdmin?: boolean
}

interface TimeOffFormData {
  startDate: string
  endDate: string
  reason: string
}

const STATUS_BADGES: Record<
  TimeOffRequest['status'],
  { variant: 'warning' | 'success' | 'danger'; label: string }
> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
}

export function TimeOffManager({ staffId, isAdmin = false }: TimeOffManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<TimeOffFormData>({
    startDate: '',
    endDate: '',
    reason: '',
  })

  const { data: requests, isLoading } = useTimeOffRequests(staffId)
  const createMutation = useCreateTimeOffRequest()
  const updateMutation = useUpdateTimeOffRequest()
  const deleteMutation = useDeleteTimeOffRequest()

  const handleOpenModal = () => {
    setFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ startDate: '', endDate: '', reason: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate) return

    await createMutation.mutateAsync({
      staffId,
      request: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined,
      },
    })

    handleCloseModal()
  }

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, status: 'approved' })
  }

  const handleReject = (id: string) => {
    updateMutation.mutate({ id, status: 'rejected' })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (startDate === endDate) {
      return format(start, 'MMM d, yyyy')
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card padding="lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Time Off Requests</CardTitle>
          <Button size="sm" onClick={handleOpenModal}>
            <Plus className="mr-1.5 h-4 w-4" />
            Request Time Off
          </Button>
        </CardHeader>

        {requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => {
              const statusBadge = STATUS_BADGES[request.status]
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-xl border-2 border-[#1e293b] bg-white p-3 shadow-[2px_2px_0px_0px_#1e293b]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#e9d5ff] p-2">
                      <Calendar className="h-4 w-4 text-[#7c3aed]" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#1e293b]">
                        {formatDateRange(request.startDate, request.endDate)}
                      </div>
                      {request.reason && (
                        <p className="mt-0.5 text-sm text-[#64748b]">{request.reason}</p>
                      )}
                      <p className="mt-1 text-xs text-[#94a3b8]">
                        Requested {format(parseISO(request.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadge.variant} size="sm">
                      {statusBadge.label}
                    </Badge>

                    {/* Admin controls for pending requests */}
                    {isAdmin && request.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg border-2 border-[#1e293b] bg-[#d1fae5] p-1.5 transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1e293b] disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="h-4 w-4 text-[#166534]" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg border-2 border-[#1e293b] bg-[#fce7f3] p-1.5 transition-all hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1e293b] disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="h-4 w-4 text-[#be123c]" />
                        </button>
                      </div>
                    )}

                    {/* Delete button for own pending requests */}
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(request.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg border-2 border-[#1e293b] bg-white p-1.5 transition-all hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-[2px_2px_0px_0px_#1e293b] disabled:opacity-50"
                        title="Delete request"
                      >
                        <Trash2 className="h-4 w-4 text-[#64748b]" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-[#94a3b8]" />
            <p className="mt-2 text-sm text-[#64748b]">No time off requests</p>
          </div>
        )}
      </Card>

      {/* Request Time Off Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Request Time Off"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
            <Input
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              min={formData.startDate}
              required
            />
          </div>

          <Textarea
            label="Reason (Optional)"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            placeholder="Vacation, personal day, etc."
            rows={3}
            maxLength={NOTES_MAX_LENGTH}
          />
          <p className={`mt-1 text-right text-xs ${formData.reason.length > NOTES_MAX_LENGTH - 20 ? 'text-red-500' : 'text-[#64748b]'}`}>
            {formData.reason.length}/{NOTES_MAX_LENGTH}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
