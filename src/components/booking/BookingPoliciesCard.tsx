import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/common'
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
  return (
    <Card className="border-warning-200 bg-warning-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-warning-600" />
        <div className="flex-1">
          <h3 className="font-medium text-warning-900">Booking Policies</h3>
          <p className="mt-2 text-sm text-warning-800">{policies.policyText}</p>
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={agreedToPolicy}
              onChange={(e) => onAgreedChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-warning-900">
              I agree to the booking policies
            </span>
          </label>
        </div>
      </div>
    </Card>
  )
}
