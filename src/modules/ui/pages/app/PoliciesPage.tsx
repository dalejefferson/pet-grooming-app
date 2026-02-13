import { useState, useEffect } from 'react'
import { Card, CardTitle, Button, Input, Select, Toggle, Textarea } from '../../components/common'
import { usePolicies, useUpdatePolicies, useGeneratePolicyText } from '@/hooks'
import type { BookingPolicies } from '@/types'
import { useTheme } from '../../context'
import { cn } from '@/lib/utils'

export function PoliciesPage() {
  const { colors } = useTheme()
  const { data: policies, isLoading } = usePolicies()
  const updatePolicies = useUpdatePolicies()
  const { data: generatedText } = useGeneratePolicyText(policies)

  const [formData, setFormData] = useState<Partial<BookingPolicies>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (policies) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync form state from server data on load
      setFormData(policies)
    }
  }, [policies])

  const handleChange = <K extends keyof BookingPolicies>(
    key: K,
    value: BookingPolicies[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    await updatePolicies.mutateAsync(formData)
    setHasChanges(false)
  }

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading policies...</div>
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Booking Policies</h1>
        <Button
          onClick={handleSave}
          loading={updatePolicies.isPending}
          disabled={!hasChanges}
          style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
          className="hover:opacity-90"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Mode */}
        <Card>
          <CardTitle>Booking Mode</CardTitle>
          <div className="mt-4 space-y-4">
            <Select
              label="New Client Booking"
              options={[
                { value: 'auto_confirm', label: 'Auto-confirm' },
                { value: 'request_only', label: 'Request Only (Manual Approval)' },
                { value: 'blocked', label: 'Blocked (Phone Only)' },
              ]}
              value={formData.newClientMode || 'request_only'}
              onChange={(e) => handleChange('newClientMode', e.target.value as BookingPolicies['newClientMode'])}
            />
            <Select
              label="Existing Client Booking"
              options={[
                { value: 'auto_confirm', label: 'Auto-confirm' },
                { value: 'request_only', label: 'Request Only (Manual Approval)' },
              ]}
              value={formData.existingClientMode || 'auto_confirm'}
              onChange={(e) => handleChange('existingClientMode', e.target.value as BookingPolicies['existingClientMode'])}
            />
          </div>
        </Card>

        {/* Booking Limits */}
        <Card>
          <CardTitle>Booking Limits</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label="Max Pets Per Appointment"
              type="number"
              value={formData.maxPetsPerAppointment || 3}
              onChange={(e) => handleChange('maxPetsPerAppointment', Number(e.target.value))}
              min={1}
              max={10}
            />
            <Input
              label="Min Advance Booking (hours)"
              type="number"
              value={formData.minAdvanceBookingHours || 24}
              onChange={(e) => handleChange('minAdvanceBookingHours', Number(e.target.value))}
              min={0}
            />
            <Input
              label="Max Advance Booking (days)"
              type="number"
              value={formData.maxAdvanceBookingDays || 60}
              onChange={(e) => handleChange('maxAdvanceBookingDays', Number(e.target.value))}
              min={1}
            />
          </div>
        </Card>

        {/* Deposit Settings */}
        <Card>
          <CardTitle>Deposit Settings</CardTitle>
          <div className="mt-4 space-y-4">
            <Toggle
              label="Require Deposit"
              description="Clients must pay a deposit to confirm their appointment"
              checked={formData.depositRequired ?? true}
              onChange={(checked) => handleChange('depositRequired', checked)}
            />
            {formData.depositRequired && (
              <>
                <Input
                  label="Deposit Percentage (%)"
                  type="number"
                  value={formData.depositPercentage || 25}
                  onChange={(e) => handleChange('depositPercentage', Number(e.target.value))}
                  min={0}
                  max={100}
                />
                <Input
                  label="Minimum Deposit ($)"
                  type="number"
                  value={formData.depositMinimum || 15}
                  onChange={(e) => handleChange('depositMinimum', Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
              </>
            )}
          </div>
        </Card>

        {/* Cancellation & No-Show */}
        <Card>
          <CardTitle>Cancellation & No-Show</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label="Cancellation Window (hours)"
              type="number"
              value={formData.cancellationWindowHours || 24}
              onChange={(e) => handleChange('cancellationWindowHours', Number(e.target.value))}
              min={0}
              helperText="Hours before appointment when free cancellation is allowed"
            />
            <Input
              label="Late Cancellation Fee (%)"
              type="number"
              value={formData.lateCancellationFeePercentage || 50}
              onChange={(e) => handleChange('lateCancellationFeePercentage', Number(e.target.value))}
              min={0}
              max={100}
            />
            <Input
              label="No-Show Fee (%)"
              type="number"
              value={formData.noShowFeePercentage || 50}
              onChange={(e) => handleChange('noShowFeePercentage', Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
        </Card>
      </div>

      {/* Policy Text */}
      <Card>
        <CardTitle>Policy Text</CardTitle>
        <p className="mt-2 text-sm text-gray-600">
          This text will be shown to clients during the booking process.
        </p>
        <Textarea
          className="mt-4"
          value={formData.policyText || ''}
          onChange={(e) => handleChange('policyText', e.target.value)}
          rows={4}
        />
        {generatedText && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">Auto-generated preview:</p>
            <p
              className="mt-2 rounded-lg p-3 text-sm text-gray-600"
              style={{ backgroundColor: colors.accentColorLight }}
            >
              {generatedText}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleChange('policyText', generatedText)}
              style={{ borderColor: colors.accentColorDark }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentColorLight}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Use Generated Text
            </Button>
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}
