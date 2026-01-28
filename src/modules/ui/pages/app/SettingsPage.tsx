import { Card, CardTitle, Button, Input } from '../../components/common'
import { useOrganization, useUpdateOrganization } from '@/hooks'
import { useTheme, themeColors, type ThemeName } from '../../context'
import { useState, useEffect } from 'react'
import type { Organization } from '@/types'
import { cn } from '@/lib/utils'

// Theme configuration for the picker
const themeOptions: { name: ThemeName; label: string; swatches: string[] }[] = [
  {
    name: 'mint',
    label: 'Mint',
    swatches: [themeColors.mint.accentColorLight, themeColors.mint.accentColor, themeColors.mint.accentColorDark],
  },
  {
    name: 'lavender',
    label: 'Lavender',
    swatches: [themeColors.lavender.accentColorLight, themeColors.lavender.accentColor, themeColors.lavender.accentColorDark],
  },
  {
    name: 'peach',
    label: 'Peach',
    swatches: [themeColors.peach.accentColorLight, themeColors.peach.accentColor, themeColors.peach.accentColorDark],
  },
  {
    name: 'ocean',
    label: 'Ocean',
    swatches: [themeColors.ocean.accentColorLight, themeColors.ocean.accentColor, themeColors.ocean.accentColorDark],
  },
  {
    name: 'rose',
    label: 'Rose',
    swatches: [themeColors.rose.accentColorLight, themeColors.rose.accentColor, themeColors.rose.accentColorDark],
  },
  {
    name: 'sunset',
    label: 'Sunset',
    swatches: [themeColors.sunset.accentColorLight, themeColors.sunset.accentColor, themeColors.sunset.accentColorDark],
  },
  {
    name: 'forest',
    label: 'Forest',
    swatches: [themeColors.forest.accentColorLight, themeColors.forest.accentColor, themeColors.forest.accentColorDark],
  },
  {
    name: 'sky',
    label: 'Sky',
    swatches: [themeColors.sky.accentColorLight, themeColors.sky.accentColor, themeColors.sky.accentColorDark],
  },
  {
    name: 'skyButter',
    label: 'Sky Butter',
    swatches: [themeColors.skyButter.accentColorLight, themeColors.skyButter.accentColor, themeColors.skyButter.accentColorDark],
  },
  {
    name: 'oceanCitrus',
    label: 'Ocean Citrus',
    swatches: [themeColors.oceanCitrus.accentColorLight, themeColors.oceanCitrus.accentColor, themeColors.oceanCitrus.accentColorDark],
  },
  {
    name: 'blueMango',
    label: 'Blue Mango',
    swatches: [themeColors.blueMango.accentColorLight, themeColors.blueMango.accentColor, themeColors.blueMango.accentColorDark],
  },
  {
    name: 'aquaSunset',
    label: 'Aqua Sunset',
    swatches: [themeColors.aquaSunset.accentColorLight, themeColors.aquaSunset.accentColor, themeColors.aquaSunset.accentColorDark],
  },
  {
    name: 'mintCreamsicle',
    label: 'Mint Creamsicle',
    swatches: [themeColors.mintCreamsicle.accentColorLight, themeColors.mintCreamsicle.accentColor, themeColors.mintCreamsicle.accentColorDark],
  },
  {
    name: 'mintBlush',
    label: 'Mint Blush',
    swatches: [themeColors.mintBlush.accentColorLight, themeColors.mintBlush.accentColor, themeColors.mintBlush.accentColorDark],
  },
]

export function SettingsPage() {
  const { data: organization, isLoading } = useOrganization()
  const updateOrganization = useUpdateOrganization()
  const { currentTheme, setTheme, colors } = useTheme()
  const [formData, setFormData] = useState<Partial<Organization>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (organization) {
      setFormData(organization)
    }
  }, [organization])

  const handleChange = <K extends keyof Organization>(key: K, value: Organization[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!organization) return
    await updateOrganization.mutateAsync({ id: organization.id, data: formData })
    setHasChanges(false)
  }

  if (isLoading) {
    return <div className="text-center text-gray-600">Loading settings...</div>
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Button
          onClick={handleSave}
          loading={updateOrganization.isPending}
          disabled={!hasChanges}
          style={{ backgroundColor: colors.accentColorDark }}
          className="hover:opacity-90"
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <CardTitle>Business Information</CardTitle>
        <div className="mt-4 space-y-4">
          <Input
            label="Business Name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <Input
            label="URL Slug"
            value={formData.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            helperText="Used in your booking URL: /book/your-slug"
          />
          <Input
            label="Address"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Booking Portal Link</CardTitle>
        <p className="mt-2 text-sm text-gray-600">
          Share this link with your clients to allow them to book appointments online.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm">
            {window.location.origin}/book/{formData.slug || 'your-slug'}
          </code>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/book/${formData.slug || 'your-slug'}`
              )
            }}
          >
            Copy
          </Button>
        </div>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardTitle>Theme</CardTitle>
        <p className="mt-2 text-sm text-gray-600">
          Choose your color palette
        </p>
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
          {themeOptions.map((theme) => {
            const isSelected = currentTheme === theme.name
            return (
              <button
                key={theme.name}
                onClick={() => setTheme(theme.name)}
                className={`relative flex flex-col items-center gap-3 rounded-xl border-2 border-[#1e293b] p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'shadow-[4px_4px_0px_0px_#1e293b] bg-white'
                    : 'bg-white/50 hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] bg-green-400">
                    <svg
                      className="h-4 w-4 text-[#1e293b]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Color swatches preview */}
                <div className="flex gap-1">
                  {theme.swatches.map((color, index) => (
                    <div
                      key={index}
                      className="h-8 w-8 rounded-lg border-2 border-[#1e293b]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Theme name */}
                <span className="text-sm font-semibold text-gray-900">{theme.label}</span>
              </button>
            )
          })}
        </div>
      </Card>
      </div>
    </div>
  )
}
