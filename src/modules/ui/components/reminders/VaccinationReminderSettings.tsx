import { useState, useEffect } from 'react'
import { Syringe, Save, AlertCircle } from 'lucide-react'
import { Card, CardTitle, Button, Toggle } from '../common'
import {
  useVaccinationReminderSettings,
  useUpdateVaccinationReminderSettings,
} from '@/hooks'
import type { VaccinationReminderSettings as VaccinationReminderSettingsType } from '@/types'
import { useTheme } from '../../context'
import { cn } from '@/lib/utils'

export function VaccinationReminderSettings() {
  const { colors } = useTheme()
  const { data: settings, isLoading } = useVaccinationReminderSettings()
  const updateSettings = useUpdateVaccinationReminderSettings()

  const [formData, setFormData] = useState<Partial<VaccinationReminderSettingsType>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleEnabledChange = (enabled: boolean) => {
    setFormData((prev) => ({ ...prev, enabled }))
    setHasChanges(true)
  }

  const handleReminderDaysChange = (day: number, checked: boolean) => {
    setFormData((prev) => {
      const currentDays = prev.reminderDays || [30, 7]
      const newDays = checked
        ? [...currentDays, day].sort((a, b) => b - a)
        : currentDays.filter((d) => d !== day)
      return { ...prev, reminderDays: newDays }
    })
    setHasChanges(true)
  }

  const handleChannelChange = (
    channel: 'inApp' | 'email' | 'sms',
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: checked,
      } as VaccinationReminderSettingsType['channels'],
    }))
    setHasChanges(true)
  }

  const handleBlockBookingChange = (blockBookingOnExpired: boolean) => {
    setFormData((prev) => ({ ...prev, blockBookingOnExpired }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    await updateSettings.mutateAsync(formData)
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5" style={{ color: colors.accentColorDark }} />
          <CardTitle>Vaccination Reminders</CardTitle>
        </div>
        <p className="mt-4 text-center text-gray-500">Loading settings...</p>
      </Card>
    )
  }

  const reminderDays = formData.reminderDays || [30, 7]
  const channels = formData.channels || { inApp: true, email: false, sms: false }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5" style={{ color: colors.accentColorDark }} />
          <CardTitle>Vaccination Reminders</CardTitle>
        </div>
        <Button
          onClick={handleSave}
          loading={updateSettings.isPending}
          disabled={!hasChanges}
          size="sm"
          style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
          className="hover:opacity-90"
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Automatically notify clients when their pet's vaccinations are expiring.
      </p>

      <div className="mt-6 space-y-6">
        {/* Master Toggle */}
        <Toggle
          label="Enable Vaccination Reminders"
          description="Send reminders when vaccinations are about to expire"
          checked={formData.enabled ?? true}
          onChange={handleEnabledChange}
        />

        {formData.enabled && (
          <>
            {/* Reminder Days */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#1e293b]">Reminder Schedule</h4>
              <p className="text-sm text-gray-500">
                Choose when to send reminders before vaccination expiration.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reminderDays.includes(30)}
                    onChange={(e) => handleReminderDaysChange(30, e.target.checked)}
                    className={cn(
                      'h-5 w-5 rounded border-2 border-[#1e293b]',
                      'focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2'
                    )}
                    style={{
                      accentColor: colors.accentColorDark,
                    }}
                  />
                  <span className="text-sm text-[#334155]">30 days before expiration</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={reminderDays.includes(7)}
                    onChange={(e) => handleReminderDaysChange(7, e.target.checked)}
                    className={cn(
                      'h-5 w-5 rounded border-2 border-[#1e293b]',
                      'focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2'
                    )}
                    style={{
                      accentColor: colors.accentColorDark,
                    }}
                  />
                  <span className="text-sm text-[#334155]">7 days before expiration</span>
                </label>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#1e293b]">Notification Channels</h4>
              <p className="text-sm text-gray-500">
                Select how clients should receive vaccination reminders.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={(e) => handleChannelChange('inApp', e.target.checked)}
                    className={cn(
                      'h-5 w-5 rounded border-2 border-[#1e293b]',
                      'focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2'
                    )}
                    style={{
                      accentColor: colors.accentColorDark,
                    }}
                  />
                  <span className="text-sm text-[#334155]">In-App Notifications</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => handleChannelChange('email', e.target.checked)}
                    className={cn(
                      'h-5 w-5 rounded border-2 border-[#1e293b]',
                      'focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2'
                    )}
                    style={{
                      accentColor: colors.accentColorDark,
                    }}
                  />
                  <span className="text-sm text-[#334155]">Email</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={(e) => handleChannelChange('sms', e.target.checked)}
                    className={cn(
                      'h-5 w-5 rounded border-2 border-[#1e293b]',
                      'focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2'
                    )}
                    style={{
                      accentColor: colors.accentColorDark,
                    }}
                  />
                  <span className="text-sm text-[#334155]">SMS</span>
                </label>
              </div>
            </div>

            {/* Block Booking */}
            <div
              className={cn(
                'rounded-xl border-2 border-[#1e293b] p-4',
                formData.blockBookingOnExpired
                  ? 'bg-amber-50'
                  : 'bg-white'
              )}
            >
              <Toggle
                label="Block Booking on Expired Vaccinations"
                description="Prevent clients from booking appointments if their pet has expired vaccinations"
                checked={formData.blockBookingOnExpired ?? false}
                onChange={handleBlockBookingChange}
              />
              {formData.blockBookingOnExpired && (
                <div className="mt-3 flex items-start gap-2 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Clients will be notified about expired vaccinations and redirected to update
                    their pet's records before booking.
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
