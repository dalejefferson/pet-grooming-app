import { useState, useMemo } from 'react'
import { Search, Plus, Filter, Users, Calendar, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, Button, Input, Modal, Badge, Select, HistorySection } from '../../components/common'
import { GroomerForm } from '../../components/groomers'
import { StaffCard } from '../../components/staff'
import {
  useGroomers,
  useCreateGroomer,
  useUpdateGroomer,
  useDeletedHistory,
  useTimeOffRequests,
  useUpdateTimeOffRequest,
} from '@/hooks'
import { PermissionGate } from '@/modules/auth'
import { cn } from '@/lib/utils'
import type { Groomer, TimeOffRequest, DaySchedule } from '@/types'
import { useTheme } from '../../context'

type TabValue = 'all' | 'schedule' | 'timeoff'
type RoleFilter = 'all' | 'admin' | 'groomer' | 'receptionist'
type TimeOffStatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const ROLE_LABELS: Record<Groomer['role'], string> = {
  admin: 'Admin',
  groomer: 'Groomer',
  receptionist: 'Receptionist',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_BADGES: Record<TimeOffRequest['status'], { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
}

export function StaffPage() {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [timeOffStatusFilter, setTimeOffStatusFilter] = useState<TimeOffStatusFilter>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Groomer | null>(null)

  const { data: staff = [], isLoading } = useGroomers()
  const { data: deletedItems = [] } = useDeletedHistory('groomer')
  const { data: allTimeOffRequests = [] } = useTimeOffRequests()
  const createGroomer = useCreateGroomer()
  const updateGroomer = useUpdateGroomer()
  const updateTimeOff = useUpdateTimeOffRequest()

  // Filter staff by search and role
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        !searchQuery ||
        member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesRole = roleFilter === 'all' || member.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [staff, searchQuery, roleFilter])

  // Separate active and inactive staff
  const activeStaff = filteredStaff.filter((s) => s.isActive)
  const inactiveStaff = filteredStaff.filter((s) => !s.isActive)

  // Filter time off requests
  const filteredTimeOffRequests = useMemo(() => {
    return allTimeOffRequests.filter((request) => {
      return timeOffStatusFilter === 'all' || request.status === timeOffStatusFilter
    })
  }, [allTimeOffRequests, timeOffStatusFilter])

  const handleCreate = async (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createGroomer.mutateAsync(data)
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingStaff) {
      await updateGroomer.mutateAsync({ id: editingStaff.id, data })
      setEditingStaff(null)
    }
  }

  const handleApproveTimeOff = (id: string) => {
    updateTimeOff.mutate({ id, status: 'approved' })
  }

  const handleRejectTimeOff = (id: string) => {
    updateTimeOff.mutate({ id, status: 'rejected' })
  }

  const getStaffName = (staffId: string) => {
    const member = staff.find((s) => s.id === staffId)
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown'
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    if (startDate === endDate) {
      return format(start, 'MMM d, yyyy')
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }

  const formatScheduleTime = (schedule: DaySchedule | undefined) => {
    if (!schedule || !schedule.isWorkingDay) return 'Off'
    return `${schedule.startTime} - ${schedule.endTime}`
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <PermissionGate permission="canManageStaff">
            <Button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: colors.accentColorDark }}
              className="hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </PermissionGate>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all' as TabValue, label: 'All Staff', icon: Users },
            { value: 'schedule' as TabValue, label: 'Schedule', icon: Calendar },
            { value: 'timeoff' as TabValue, label: 'Time Off', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-2 rounded-xl border-2 border-[#1e293b] px-4 py-2 text-sm font-semibold transition-all',
                activeTab === tab.value
                  ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-white text-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* All Staff Tab */}
        {activeTab === 'all' && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search staff by name, email, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <Select
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'groomer', label: 'Groomer' },
                    { value: 'receptionist', label: 'Receptionist' },
                  ]}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="w-40"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center text-gray-600">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <Card>
                <div className="py-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">
                    {searchQuery || roleFilter !== 'all'
                      ? 'No staff found matching your filters.'
                      : 'No staff yet. Add your first team member to get started.'}
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Active Staff */}
                {activeStaff.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                      Active Staff ({activeStaff.length})
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {activeStaff.map((member) => (
                        <StaffCard key={member.id} staff={member} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive Staff */}
                {inactiveStaff.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-500">
                      Inactive Staff ({inactiveStaff.length})
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {inactiveStaff.map((member) => (
                        <StaffCard key={member.id} staff={member} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <HistorySection items={deletedItems} entityType="groomer" title="Recently Deleted Staff" />
          </>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <Card padding="lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-[#1e293b]">
                    <th className="pb-3 text-left text-sm font-semibold text-[#1e293b]">Staff Member</th>
                    {DAY_NAMES.map((day) => (
                      <th key={day} className="pb-3 text-center text-sm font-semibold text-[#1e293b]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map((member) => {
                    const schedule = member.availability?.weeklySchedule || []
                    const scheduleMap = new Map(schedule.map((s) => [s.dayOfWeek, s]))

                    return (
                      <tr key={member.id} className="border-b border-gray-200">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="h-8 w-8 rounded-lg border-2 border-[#1e293b] object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#1e293b] text-xs font-bold"
                                style={{ backgroundColor: colors.accentColor }}
                              >
                                {member.firstName.charAt(0)}
                                {member.lastName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-[#1e293b]">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-[#64748b]">{ROLE_LABELS[member.role]}</p>
                            </div>
                          </div>
                        </td>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                          const daySchedule = scheduleMap.get(day as DaySchedule['dayOfWeek'])
                          const isWorking = daySchedule?.isWorkingDay

                          return (
                            <td key={day} className="py-3 text-center">
                              <div
                                className={cn(
                                  'mx-auto w-fit rounded-lg px-2 py-1 text-xs font-medium',
                                  isWorking
                                    ? 'bg-[#d1fae5] text-[#166534]'
                                    : 'bg-[#f1f5f9] text-[#64748b]'
                                )}
                              >
                                {formatScheduleTime(daySchedule)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {activeStaff.length === 0 && (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">No active staff to display schedules.</p>
              </div>
            )}
          </Card>
        )}

        {/* Time Off Tab */}
        {activeTab === 'timeoff' && (
          <>
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select
                options={[
                  { value: 'all', label: 'All Requests' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                value={timeOffStatusFilter}
                onChange={(e) => setTimeOffStatusFilter(e.target.value as TimeOffStatusFilter)}
                className="w-40"
              />
            </div>

            {filteredTimeOffRequests.length === 0 ? (
              <Card>
                <div className="py-8 text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">
                    {timeOffStatusFilter !== 'all'
                      ? `No ${timeOffStatusFilter} time off requests.`
                      : 'No time off requests.'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTimeOffRequests.map((request) => {
                  const statusBadge = STATUS_BADGES[request.status]

                  return (
                    <Card key={request.id} padding="md">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-[#e9d5ff] p-3">
                            <Calendar className="h-5 w-5 text-[#7c3aed]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1e293b]">{getStaffName(request.staffId)}</p>
                            <p className="text-sm font-medium text-[#64748b]">
                              {formatDateRange(request.startDate, request.endDate)}
                            </p>
                            {request.reason && (
                              <p className="mt-1 text-sm text-[#64748b]">{request.reason}</p>
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
                          <PermissionGate permission="canManageStaff">
                            {request.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveTimeOff(request.id)}
                                  disabled={updateTimeOff.isPending}
                                  className="bg-[#d1fae5] hover:bg-[#a7f3d0]"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectTimeOff(request.id)}
                                  disabled={updateTimeOff.isPending}
                                  className="bg-[#fce7f3] hover:bg-[#fbcfe8]"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </PermissionGate>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Staff Member"
          size="md"
        >
          <GroomerForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            isLoading={createGroomer.isPending}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          title="Edit Staff Member"
          size="md"
        >
          {editingStaff && (
            <GroomerForm
              groomer={editingStaff}
              onSubmit={handleUpdate}
              onCancel={() => setEditingStaff(null)}
              isLoading={updateGroomer.isPending}
            />
          )}
        </Modal>
      </div>
    </div>
  )
}
