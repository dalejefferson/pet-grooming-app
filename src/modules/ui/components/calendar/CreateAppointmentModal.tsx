import { useState, useMemo, useCallback } from 'react'
import { AlertTriangle, Plus, Clock, User, Scissors } from 'lucide-react'
import { Modal, Button, Input, Textarea, Select } from '../common'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'
import type { CreateAppointmentModalProps, PetServiceSelection } from './types'

/**
 * CreateAppointmentModal provides a form for creating new appointments
 * with client, pet, service, and groomer selection.
 */
export function CreateAppointmentModal({
  isOpen,
  onClose,
  clients,
  clientPets,
  services,
  groomers,
  initialStartTime,
  initialEndTime,
  onClientChange,
  selectedClientId,
  onCreateAppointment,
  isCreating,
}: CreateAppointmentModalProps) {
  const [selectedPetServices, setSelectedPetServices] = useState<PetServiceSelection[]>([])
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [createStartTime, setCreateStartTime] = useState<string>(initialStartTime)
  const [createEndTime, setCreateEndTime] = useState<string>(initialEndTime)

  // Reset form when modal opens with new times
  useMemo(() => {
    if (isOpen) {
      setCreateStartTime(initialStartTime)
      setCreateEndTime(initialEndTime)
      setSelectedPetServices([])
      setSelectedGroomerId('')
      setAppointmentNotes('')
    }
  }, [isOpen, initialStartTime, initialEndTime])

  // Handle client selection change - reset pet services when client changes
  const handleClientChange = useCallback((clientId: string) => {
    onClientChange(clientId)
    setSelectedPetServices([])
  }, [onClientChange])

  // Toggle pet selection
  const handlePetToggle = useCallback((petId: string) => {
    setSelectedPetServices((prev) => {
      const existing = prev.find((p) => p.petId === petId)
      if (existing) {
        return prev.filter((p) => p.petId !== petId)
      }
      return [...prev, { petId, serviceIds: [] }]
    })
  }, [])

  // Toggle service for a pet
  const handleServiceToggle = useCallback((petId: string, serviceId: string) => {
    setSelectedPetServices((prev) => {
      return prev.map((p) => {
        if (p.petId !== petId) return p
        const hasService = p.serviceIds.includes(serviceId)
        return {
          ...p,
          serviceIds: hasService
            ? p.serviceIds.filter((s) => s !== serviceId)
            : [...p.serviceIds, serviceId],
        }
      })
    })
  }, [])

  // Calculate total based on selected services
  const calculatedTotal = useMemo(() => {
    let total = 0
    selectedPetServices.forEach((ps) => {
      ps.serviceIds.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        if (service) {
          total += service.basePrice
        }
      })
    })
    return total
  }, [selectedPetServices, services])

  // Calculate total duration
  const calculatedDuration = useMemo(() => {
    let duration = 0
    selectedPetServices.forEach((ps) => {
      ps.serviceIds.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        if (service) {
          duration += service.baseDurationMinutes
        }
      })
    })
    return duration
  }, [selectedPetServices, services])

  // Handle create appointment submission
  const handleSubmit = useCallback(async () => {
    if (!selectedClientId || selectedPetServices.length === 0) return

    // Validate at least one pet has services
    const hasServices = selectedPetServices.some((ps) => ps.serviceIds.length > 0)
    if (!hasServices) return

    await onCreateAppointment({
      clientId: selectedClientId,
      petServices: selectedPetServices,
      groomerId: selectedGroomerId,
      notes: appointmentNotes,
      startTime: createStartTime,
      endTime: createEndTime,
    })
  }, [
    selectedClientId,
    selectedPetServices,
    selectedGroomerId,
    appointmentNotes,
    createStartTime,
    createEndTime,
    onCreateAppointment,
  ])

  // Close and reset
  const handleClose = useCallback(() => {
    setSelectedPetServices([])
    setSelectedGroomerId('')
    setAppointmentNotes('')
    onClose()
  }, [onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Appointment"
      size="xl"
    >
      <div className="space-y-6">
        {/* No Clients Warning */}
        {clients.length === 0 ? (
          <div className="rounded-xl border-2 border-[#fbbf24] bg-[#fef9c3] p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#854d0e]" />
              <div>
                <p className="font-semibold text-[#854d0e]">No Clients Found</p>
                <p className="text-sm text-[#854d0e]/80">
                  Please add clients first before creating appointments.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Time Section */}
            <div className="rounded-xl border-2 border-[#1e293b] bg-[#ecfccb]/30 p-3 sm:p-4 shadow-[2px_2px_0px_0px_#1e293b]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-[#334155]" />
                <h3 className="font-semibold text-[#1e293b]">Appointment Time</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  label="Start Time"
                  value={createStartTime}
                  onChange={(e) => setCreateStartTime(e.target.value)}
                />
                <Input
                  type="datetime-local"
                  label="End Time"
                  value={createEndTime}
                  onChange={(e) => setCreateEndTime(e.target.value)}
                />
              </div>
              {calculatedDuration > 0 && (
                <p className="mt-2 text-sm text-[#64748b]">
                  Estimated duration based on services: {formatDuration(calculatedDuration)}
                </p>
              )}
            </div>

            {/* Client Selection */}
            <div className="rounded-xl border-2 border-[#1e293b] bg-[#d1fae5]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-[#334155]" />
                <h3 className="font-semibold text-[#1e293b]">Client</h3>
              </div>
              <Select
                label="Select Client"
                placeholder="Choose a client..."
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                options={clients.map((c) => ({
                  value: c.id,
                  label: `${c.firstName} ${c.lastName}`,
                }))}
              />
            </div>

            {/* Pet Selection */}
            {selectedClientId && (
              <div className="rounded-xl border-2 border-[#1e293b] bg-[#fce7f3]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
                <h3 className="font-semibold text-[#1e293b] mb-3">Pets</h3>
                {clientPets.length === 0 ? (
                  <p className="text-sm text-[#64748b]">No pets found for this client.</p>
                ) : (
                  <div className="space-y-3">
                    {clientPets.map((pet) => {
                      const isSelected = selectedPetServices.some((ps) => ps.petId === pet.id)
                      const petServiceSelection = selectedPetServices.find((ps) => ps.petId === pet.id)
                      return (
                        <div
                          key={pet.id}
                          className={cn(
                            'rounded-xl border-2 p-3 transition-all cursor-pointer',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 shadow-[2px_2px_0px_0px_#49634c]'
                              : 'border-[#1e293b] bg-white hover:bg-[#f0fdf4]'
                          )}
                          onClick={() => handlePetToggle(pet.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#1e293b]">{pet.name}</p>
                              <p className="text-sm text-[#64748b]">
                                {pet.breed} - {pet.species}
                              </p>
                            </div>
                            <div
                              className={cn(
                                'h-5 w-5 rounded-md border-2 flex items-center justify-center',
                                isSelected
                                  ? 'bg-primary-500 border-primary-500'
                                  : 'border-[#1e293b] bg-white'
                              )}
                            >
                              {isSelected && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Services for this pet */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-[#1e293b]/20" onClick={(e) => e.stopPropagation()}>
                              <p className="text-sm font-medium text-[#334155] mb-2">Select Services:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {services.filter((s) => s.isActive).map((service) => {
                                  const isServiceSelected = petServiceSelection?.serviceIds.includes(service.id)
                                  return (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() => handleServiceToggle(pet.id, service.id)}
                                      className={cn(
                                        'flex items-center justify-between p-3 sm:p-2 rounded-lg border-2 text-left text-sm transition-all min-h-[44px]',
                                        isServiceSelected
                                          ? 'border-accent-500 bg-accent-50 text-accent-700'
                                          : 'border-[#1e293b] bg-white hover:bg-[#fef9c3]'
                                      )}
                                    >
                                      <span className="font-medium truncate">{service.name}</span>
                                      <span className="text-xs ml-2 flex-shrink-0">{formatCurrency(service.basePrice)}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Groomer Selection */}
            <div className="rounded-xl border-2 border-[#1e293b] bg-[#e9d5ff]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="h-5 w-5 text-[#334155]" />
                <h3 className="font-semibold text-[#1e293b]">Groomer (Optional)</h3>
              </div>
              <Select
                label="Select Groomer"
                placeholder="Choose a groomer..."
                value={selectedGroomerId}
                onChange={(e) => setSelectedGroomerId(e.target.value)}
                options={[
                  { value: '', label: 'Any available groomer' },
                  ...groomers.filter((g) => g.isActive).map((g) => ({
                    value: g.id,
                    label: `${g.firstName} ${g.lastName}`,
                  })),
                ]}
              />
            </div>

            {/* Notes */}
            <div>
              <Textarea
                label="Notes (Optional)"
                placeholder="Add any notes for this appointment..."
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Total & Submit */}
            <div className="rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[2px_2px_0px_0px_#1e293b]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-[#1e293b]">Estimated Total</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={
                    !selectedClientId ||
                    selectedPetServices.length === 0 ||
                    !selectedPetServices.some((ps) => ps.serviceIds.length > 0) ||
                    isCreating
                  }
                  loading={isCreating}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Appointment
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
