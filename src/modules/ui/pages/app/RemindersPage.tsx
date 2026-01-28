import { useState, useEffect } from 'react'
import { MessageSquare, Clock, RefreshCw } from 'lucide-react'
import { Card, CardTitle, Button, Input, Toggle, Textarea } from '../../components/common'
import { useReminders, useUpdateReminders, usePreviewReminder, useDefaultTemplates } from '@/hooks'
import type { ReminderSchedule } from '@/types'
import { useTheme } from '../../context'
import { cn } from '@/lib/utils'

export function RemindersPage() {
  const { colors } = useTheme()
  const { data: reminders, isLoading } = useReminders()
  const updateReminders = useUpdateReminders()
  const { data: defaultTemplates } = useDefaultTemplates()

  const [formData, setFormData] = useState<Partial<ReminderSchedule>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [previewKey, setPreviewKey] = useState<'48h' | '24h' | '2h' | 'dueForGrooming'>('24h')

  const { data: preview } = usePreviewReminder(previewKey)

  useEffect(() => {
    if (reminders) {
      setFormData(reminders)
    }
  }, [reminders])

  const handleAppointmentReminderChange = <
    K extends keyof ReminderSchedule['appointmentReminders']
  >(
    key: K,
    value: ReminderSchedule['appointmentReminders'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      appointmentReminders: {
        ...prev.appointmentReminders,
        [key]: value,
      } as ReminderSchedule['appointmentReminders'],
    }))
    setHasChanges(true)
  }

  const handleDueForGroomingChange = <
    K extends keyof ReminderSchedule['dueForGrooming']
  >(
    key: K,
    value: ReminderSchedule['dueForGrooming'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      dueForGrooming: {
        ...prev.dueForGrooming,
        [key]: value,
      } as ReminderSchedule['dueForGrooming'],
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    await updateReminders.mutateAsync(formData)
    setHasChanges(false)
  }

  const resetToDefault = (
    template: '48h' | '24h' | '2h' | 'dueForGrooming'
  ) => {
    if (!defaultTemplates) return

    if (template === 'dueForGrooming') {
      handleDueForGroomingChange('template', defaultTemplates.dueForGrooming)
    } else {
      const key = `template${template}` as 'template48h' | 'template24h' | 'template2h'
      handleAppointmentReminderChange(key, defaultTemplates[key])
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading reminder settings...</div>
  }

  const appointmentReminders = formData.appointmentReminders
  const dueForGrooming = formData.dueForGrooming

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Reminder Settings</h1>
        <Button
          onClick={handleSave}
          loading={updateReminders.isPending}
          disabled={!hasChanges}
          style={{ backgroundColor: colors.accentColorDark }}
          className="hover:opacity-90"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointment Reminders */}
        <Card>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: colors.accentColorDark }} />
            <CardTitle>Appointment Reminders</CardTitle>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Send automated reminders before scheduled appointments.
          </p>

          <div className="mt-6 space-y-6">
            {/* 48h Reminder */}
            <div className="space-y-3">
              <Toggle
                label="48-Hour Reminder"
                description="Send reminder 2 days before appointment"
                checked={appointmentReminders?.enabled48h ?? true}
                onChange={(checked) => handleAppointmentReminderChange('enabled48h', checked)}
              />
              {appointmentReminders?.enabled48h && (
                <div>
                  <Textarea
                    value={appointmentReminders?.template48h || ''}
                    onChange={(e) => handleAppointmentReminderChange('template48h', e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => resetToDefault('48h')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>
              )}
            </div>

            {/* 24h Reminder */}
            <div className="space-y-3">
              <Toggle
                label="24-Hour Reminder"
                description="Send reminder 1 day before appointment"
                checked={appointmentReminders?.enabled24h ?? true}
                onChange={(checked) => handleAppointmentReminderChange('enabled24h', checked)}
              />
              {appointmentReminders?.enabled24h && (
                <div>
                  <Textarea
                    value={appointmentReminders?.template24h || ''}
                    onChange={(e) => handleAppointmentReminderChange('template24h', e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => resetToDefault('24h')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>
              )}
            </div>

            {/* 2h Reminder */}
            <div className="space-y-3">
              <Toggle
                label="2-Hour Reminder"
                description="Send reminder 2 hours before appointment"
                checked={appointmentReminders?.enabled2h ?? false}
                onChange={(checked) => handleAppointmentReminderChange('enabled2h', checked)}
              />
              {appointmentReminders?.enabled2h && (
                <div>
                  <Textarea
                    value={appointmentReminders?.template2h || ''}
                    onChange={(e) => handleAppointmentReminderChange('template2h', e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => resetToDefault('2h')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Due for Grooming */}
        <Card>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: colors.accentColorDark }} />
            <CardTitle>Due for Grooming</CardTitle>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Send nudge reminders to clients when their pet is due for grooming.
          </p>

          <div className="mt-6 space-y-6">
            <Toggle
              label="Enable Due for Grooming Reminders"
              description="Automatically remind clients when their pet needs grooming"
              checked={dueForGrooming?.enabled ?? true}
              onChange={(checked) => handleDueForGroomingChange('enabled', checked)}
            />

            {dueForGrooming?.enabled && (
              <>
                <Input
                  label="Interval (days)"
                  type="number"
                  value={dueForGrooming?.intervalDays || 42}
                  onChange={(e) => handleDueForGroomingChange('intervalDays', Number(e.target.value))}
                  min={7}
                  max={365}
                  helperText="Days since last grooming to trigger reminder"
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Message Template
                  </label>
                  <Textarea
                    value={dueForGrooming?.template || ''}
                    onChange={(e) => handleDueForGroomingChange('template', e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => resetToDefault('dueForGrooming')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Template Variables & Preview */}
      <Card>
        <CardTitle>Template Variables & Preview</CardTitle>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Available Variables</h3>
            <div className="mt-2 space-y-1">
              <code className="block text-sm text-gray-600">{'{{clientName}}'} - Client's first name</code>
              <code className="block text-sm text-gray-600">{'{{petName}}'} - Pet's name</code>
              <code className="block text-sm text-gray-600">{'{{date}}'} - Appointment date</code>
              <code className="block text-sm text-gray-600">{'{{time}}'} - Appointment time</code>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <select
                value={previewKey}
                onChange={(e) => setPreviewKey(e.target.value as typeof previewKey)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="48h">48-Hour</option>
                <option value="24h">24-Hour</option>
                <option value="2h">2-Hour</option>
                <option value="dueForGrooming">Due for Grooming</option>
              </select>
            </div>
            <div
              className="mt-2 rounded-lg p-3 text-sm text-gray-700"
              style={{ backgroundColor: colors.accentColorLight }}
            >
              {preview || 'Loading preview...'}
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  )
}
