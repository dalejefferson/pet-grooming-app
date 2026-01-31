import { useState, useMemo, useCallback } from 'react'
import { Card, CardTitle, Button, Select, Badge } from '../common'
import { Toggle } from '../common/Toggle'
import { usePermissions, useUpdateUserPermissions } from '@/modules/auth'
import { useUsers } from '@/modules/auth'
import type { RolePermissions, StaffRole } from '@/types'
import { ROLE_PERMISSIONS, PERMISSION_LABELS } from '@/types'
import type { User } from '@/modules/auth'
import { cn } from '@/lib/utils'
import { useTheme } from '../../context'

export interface StaffPermissionsPanelProps {
  staffUserId?: string
  staffRole: StaffRole
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'groomer', label: 'Groomer' },
  { value: 'receptionist', label: 'Receptionist' },
]

const CATEGORIES_ORDER = ['Staff', 'Clients', 'Calendar', 'Booking', 'Services', 'Policies', 'Reports', 'Settings', 'Data']

function groupPermissionsByCategory() {
  const groups: Record<string, { key: keyof RolePermissions; label: string; description: string }[]> = {}
  for (const [key, meta] of Object.entries(PERMISSION_LABELS)) {
    if (!groups[meta.category]) {
      groups[meta.category] = []
    }
    groups[meta.category].push({
      key: key as keyof RolePermissions,
      label: meta.label,
      description: meta.description,
    })
  }
  return groups
}

const PERMISSION_GROUPS = groupPermissionsByCategory()

export function StaffPermissionsPanel({ staffUserId, staffRole }: StaffPermissionsPanelProps) {
  const { colors } = useTheme()
  const { currentUser, isOwner } = usePermissions()
  const { data: users } = useUsers()
  const updatePermissions = useUpdateUserPermissions()

  const staffUser = useMemo(
    () => users?.find((u: User) => u.id === staffUserId),
    [users, staffUserId]
  )

  // Derive initial values from the loaded user data, falling back to props
  const initialRole = staffUser?.role ?? staffRole
  const initialOverrides = staffUser?.permissionOverrides ?? {}

  const [selectedRole, setSelectedRole] = useState<StaffRole>(initialRole)
  const [localOverrides, setLocalOverrides] = useState<Partial<RolePermissions>>(initialOverrides)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync state when user data changes from server (e.g., after save)
  const [syncedUserId, setSyncedUserId] = useState<string | undefined>(undefined)
  if (staffUser && staffUser.id !== syncedUserId) {
    setSyncedUserId(staffUser.id)
    setSelectedRole(staffUser.role)
    setLocalOverrides(staffUser.permissionOverrides || {})
    setHasChanges(false)
  }

  const isSelf = currentUser?.id === staffUserId
  const isViewingOwner = staffUser?.role === 'owner'
  const isViewingAdmin = staffUser?.role === 'admin'
  const isSelfOwner = isSelf && isOwner
  const canEdit = isSelfOwner || (!isSelf && !isViewingOwner && (isOwner || (!isViewingAdmin)))

  const roleDefaults = ROLE_PERMISSIONS[selectedRole]

  const effectivePermissions = useMemo(() => {
    return { ...roleDefaults, ...localOverrides }
  }, [roleDefaults, localOverrides])

  const handleToggle = useCallback((key: keyof RolePermissions, checked: boolean) => {
    setLocalOverrides((prev) => {
      const newOverrides = { ...prev }
      if (checked === roleDefaults[key]) {
        delete newOverrides[key]
      } else {
        newOverrides[key] = checked
      }
      return newOverrides
    })
    setHasChanges(true)
    setSaveSuccess(false)
  }, [roleDefaults])

  const handleRoleChange = (newRole: StaffRole) => {
    setSelectedRole(newRole)
    setLocalOverrides({})
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const handleResetToDefaults = () => {
    setLocalOverrides({})
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!staffUserId) return
    await updatePermissions.mutateAsync({
      userId: staffUserId,
      role: selectedRole,
      permissionOverrides: Object.keys(localOverrides).length > 0 ? localOverrides : undefined,
    })
    setHasChanges(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const isOverridden = (key: keyof RolePermissions) => {
    return localOverrides[key] !== undefined
  }

  const hasOverrides = Object.keys(localOverrides).length > 0

  const roleOptions = isOwner
    ? [{ value: 'owner' as StaffRole, label: 'Owner' }, ...ROLE_OPTIONS]
    : ROLE_OPTIONS

  if (!staffUserId) {
    return (
      <Card padding="lg">
        <div className="text-center py-8 text-[#64748b]">
          <p className="font-medium text-[#1e293b]">No linked user account</p>
          <p className="mt-1 text-sm">This staff member does not have a user account linked for permissions.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {isSelf && !isOwner && (
        <Card padding="md" colorVariant="lemon">
          <p className="text-sm font-medium text-[#1e293b]">
            You cannot edit your own permissions. Ask another admin or the owner to make changes.
          </p>
        </Card>
      )}

      {isViewingOwner && !isSelf && (
        <Card padding="md" colorVariant="lavender">
          <p className="text-sm font-medium text-[#1e293b]">
            Owner permissions are immutable and cannot be modified.
          </p>
        </Card>
      )}

      <Card padding="lg">
        <CardTitle>Role Template</CardTitle>
        <p className="mt-1 text-sm text-[#64748b]">
          The role determines the default permission set. You can override individual permissions below.
        </p>
        <div className="mt-4 max-w-xs">
          <Select
            label="Role"
            options={roleOptions.map((r) => ({ value: r.value, label: r.label }))}
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
            disabled={!canEdit}
          />
        </div>
        {selectedRole !== staffRole && canEdit && (
          <p className="mt-2 text-xs text-[#f59e0b] font-medium">
            Changing the role will reset all permission overrides.
          </p>
        )}
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between">
          <CardTitle>Permissions</CardTitle>
          {hasOverrides && canEdit && (
            <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
              Reset to Defaults
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm text-[#64748b]">
          Toggle individual permissions on or off. Overrides are marked with a badge.
        </p>

        <div className="mt-6 space-y-6">
          {CATEGORIES_ORDER.filter((cat) => PERMISSION_GROUPS[cat]).map((category) => (
            <div key={category}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0] pb-1">
                {category}
              </h3>
              <div className="space-y-3">
                {PERMISSION_GROUPS[category].map((perm) => (
                  <div
                    key={perm.key}
                    className={cn(
                      'flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all',
                      isOverridden(perm.key)
                        ? 'border-[#1e293b] bg-[#e9d5ff]/30 shadow-[2px_2px_0px_0px_#1e293b]'
                        : 'border-[#e2e8f0] bg-white'
                    )}
                  >
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1e293b]">{perm.label}</span>
                        {isOverridden(perm.key) ? (
                          <span className="inline-flex items-center rounded-lg border-2 border-[#1e293b] bg-[#e9d5ff] px-1.5 py-0.5 text-[10px] font-bold text-[#7c3aed] shadow-[1px_1px_0px_0px_#1e293b]">
                            Custom
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#94a3b8]">Default</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#64748b]">{perm.description}</p>
                    </div>
                    <Toggle
                      checked={effectivePermissions[perm.key]}
                      onChange={(checked) => handleToggle(perm.key, checked)}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {saveSuccess && (
            <Badge variant="success" size="sm">
              Permissions saved
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={!hasOverrides || updatePermissions.isPending}
          >
            Reset to Defaults
          </Button>
          <Button
            loading={updatePermissions.isPending}
            disabled={!hasChanges}
            onClick={handleSave}
            style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
