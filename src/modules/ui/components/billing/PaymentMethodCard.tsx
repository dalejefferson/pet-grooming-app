import { Card, CardTitle, Button } from '../common'
import { useCreatePortalSession } from '@/modules/database/hooks'
import { useSubscriptionContext } from '../../context/SubscriptionContext'
import { useTheme } from '@/modules/ui/context/ThemeContext'
import type { StripePaymentMethod } from '@/modules/database/types'
import { CreditCard } from 'lucide-react'

interface PaymentMethodCardProps {
  paymentMethod: StripePaymentMethod | null | undefined
}

function formatBrand(brand: string): string {
  const brands: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
  }
  return brands[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1)
}

export function PaymentMethodCard({ paymentMethod }: PaymentMethodCardProps) {
  const portal = useCreatePortalSession()
  const { subscription, devBypass } = useSubscriptionContext()
  const { colors } = useTheme()

  // No subscription and not in dev bypass — no payment method to show
  if (!subscription && !devBypass) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" style={{ color: colors.accentColorDark }} />
          <CardTitle>Payment Method</CardTitle>
        </div>
        <p className="mt-3 text-sm text-[#64748b]">
          Subscribe to a plan to manage payment methods.
        </p>
      </Card>
    )
  }

  // Dev bypass with no real subscription
  if (devBypass && !subscription) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" style={{ color: colors.accentColorDark }} />
          <CardTitle>Payment Method</CardTitle>
        </div>
        <p className="mt-3 text-sm text-[#64748b]">
          No payment method in dev mode.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5" style={{ color: colors.accentColorDark }} />
        <CardTitle>Payment Method</CardTitle>
      </div>

      {paymentMethod ? (
        <div className="mt-4">
          <div className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-gray-50 px-4 py-3 shadow-[2px_2px_0px_0px_#1e293b]">
            <CreditCard className="h-6 w-6" style={{ color: colors.accentColorDark }} />
            <div>
              <p className="font-semibold text-[#1e293b]">
                {formatBrand(paymentMethod.brand)} ending in {paymentMethod.last4}
              </p>
              <p className="text-sm text-[#64748b]">
                Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            loading={portal.isPending}
            onClick={() => portal.mutate()}
          >
            Update Payment Method
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-[#64748b]">
            No payment method on file. Add one to ensure uninterrupted service.
          </p>
          <Button
            variant="themed"
            size="sm"
            className="mt-3"
            loading={portal.isPending}
            onClick={() => portal.mutate()}
          >
            Add Payment Method
          </Button>
        </div>
      )}

      {portal.isError && (
        <p className="mt-2 text-sm text-red-600">{portal.error.message}</p>
      )}
    </Card>
  )
}
