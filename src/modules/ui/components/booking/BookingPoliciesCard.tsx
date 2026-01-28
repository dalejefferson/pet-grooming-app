import { AlertCircle } from 'lucide-react'
import { Card } from '../common'
import { useTheme } from '@/modules/ui/context'
import type { BookingPolicies } from '@/types'

interface BookingPoliciesCardProps {
  policies: BookingPolicies
  agreedToPolicy: boolean
  onAgreedChange: (agreed: boolean) => void
}

export function BookingPoliciesCard({
  policies,
  agreedToPolicy,
  onAgreedChange,
}: BookingPoliciesCardProps) {
  const { colors } = useTheme()

  return (
    <Card
      className="border-2 border-[#1e293b]"
      style={{ backgroundColor: colors.accentColorLight }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5"
          style={{ color: colors.accentColorDark }}
        />
        <div className="flex-1">
          <h3 className="font-medium text-[#1e293b]">Booking Policies</h3>
          <p className="mt-2 text-sm text-[#334155]">{policies.policyText}</p>
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={agreedToPolicy}
              onChange={(e) => onAgreedChange(e.target.checked)}
              className="h-4 w-4 rounded border-[#1e293b] focus:ring-2 focus:ring-[#1e293b]"
              style={{ accentColor: colors.accentColorDark }}
            />
            <span className="text-sm text-[#1e293b]">
              I agree to the booking policies
            </span>
          </label>
        </div>
      </div>
    </Card>
  )
}
