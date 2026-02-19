import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardTitle } from '../../components/common'
import { PlanStatusCard, PlanComparison, InvoiceHistory, PaymentMethodCard } from '../../components/billing'
import { useSubscriptionContext } from '../../context/SubscriptionContext'
import { useInvoices } from '@/modules/database/hooks'
import { useTheme, useToast } from '../../context'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BillingPage() {
  const { subscription, devBypass } = useSubscriptionContext()
  const { colors } = useTheme()
  const { showSuccess } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const billingHandledRef = useRef(false)
  const { data: invoiceData } = useInvoices()

  // Handle billing success/cancel query params
  useEffect(() => {
    if (billingHandledRef.current) return
    const billing = searchParams.get('billing')
    if (!billing) return

    billingHandledRef.current = true

    if (billing === 'success') {
      showSuccess('Subscription updated!', 'Your billing changes have been saved.')
    } else if (billing === 'canceled') {
      showSuccess('Checkout canceled', 'No changes were made to your subscription.')
    }

    const newParams = new URLSearchParams(searchParams)
    newParams.delete('billing')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams, showSuccess])

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <h1 className="text-2xl font-bold text-[#1e293b]">Billing</h1>
      <div className="mt-6 space-y-6">
        {/* Dev bypass indicator — shown inline, doesn't hide other sections */}
        {devBypass && !subscription && (
          <Card colorVariant="lemon">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: colors.accentColorDark }} />
              <CardTitle>Dev Bypass Active</CardTitle>
            </div>
            <p className="mt-2 text-sm text-[#64748b]">
              Subscription gates are bypassed. All features are unlocked for development.
              Set <code className="rounded bg-gray-100 px-1 text-xs">VITE_DEV_BYPASS_SUBSCRIPTION=false</code> to test real gating.
            </p>
          </Card>
        )}
        <PlanStatusCard />
        <PlanComparison />
        <InvoiceHistory />
        <PaymentMethodCard paymentMethod={invoiceData?.paymentMethod} />
      </div>
    </div>
  )
}
