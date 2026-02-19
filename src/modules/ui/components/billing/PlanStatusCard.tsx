import { useState } from 'react'
import { Card, CardTitle, Button, Badge } from '../common'
import { useSubscriptionContext } from '../../context/SubscriptionContext'
import { useCreatePortalSession, useCancelSubscription } from '@/modules/database/hooks'
import { useTheme } from '@/modules/ui/context/ThemeContext'
import { Crown, AlertTriangle } from 'lucide-react'
import { PLANS, getStatusBadge } from './plans'
import { CancelSubscriptionModal } from './CancelSubscriptionModal'

export function PlanStatusCard() {
  const {
    subscription,
    planTier,
    isSubscriptionActive,
    isTrialing,
    trialDaysRemaining,
    isLoading,
  } = useSubscriptionContext()
  const portal = useCreatePortalSession()
  const cancelMutation = useCancelSubscription()
  const { colors } = useTheme()
  const [showCancelModal, setShowCancelModal] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Current Plan</CardTitle>
        <p className="mt-2 text-sm text-gray-500">Loading plan information...</p>
      </Card>
    )
  }

  if (!subscription || subscription.status === 'canceled') {
    return (
      <Card>
        <CardTitle>Current Plan</CardTitle>
        <p className="mt-3 text-sm text-[#64748b]">No active plan.</p>
        <a
          href="#plan-comparison"
          className="mt-2 inline-block text-sm font-semibold text-[var(--accent-color-dark)] underline decoration-2 underline-offset-2 hover:opacity-80"
        >
          Compare plans below
        </a>
      </Card>
    )
  }

  const plan = PLANS.find((p) => p.tier === planTier)
  const badge = getStatusBadge(subscription.status)

  const price = plan
    ? subscription.billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    : null

  const canCancel =
    (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    !subscription?.cancelAtPeriodEnd

  return (
    <Card>
      <div className="flex items-start justify-between">
        <CardTitle>Current Plan</CardTitle>
        <Badge variant={badge.variant}>
          {badge.label}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {/* Plan name + interval */}
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#1e293b]" />
          <span className="font-semibold" style={{ color: colors.accentColorDark }}>{plan?.name ?? planTier} Plan</span>
          <span className="text-sm text-[#64748b]">
            ({subscription.billingInterval === 'yearly' ? 'Annual' : 'Monthly'})
          </span>
        </div>

        {/* Next billing date + amount */}
        {isSubscriptionActive && subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
          <p className="text-sm text-[#64748b]">
            Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            {price != null && (
              <> &mdash; ${price}/{subscription.billingInterval === 'yearly' ? 'yr' : 'mo'}</>
            )}
          </p>
        )}

        {/* Trial countdown */}
        {isTrialing && trialDaysRemaining != null && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] px-3 py-2 shadow-[2px_2px_0px_0px_#1e293b]" style={{ backgroundColor: colors.accentColor + '33' }}>
            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: colors.accentColorDark }} />
            <span className="text-sm font-medium" style={{ color: colors.accentColorDark }}>
              {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in your free trial
            </span>
          </div>
        )}

        {/* Past due warning */}
        {subscription.status === 'past_due' && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#fce7f3] px-3 py-2 shadow-[2px_2px_0px_0px_#1e293b]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#be123c]" />
            <span className="text-sm font-medium text-[#be123c]">
              Payment failed. Please update your payment method to avoid service interruption.
            </span>
          </div>
        )}

        {/* Cancel-at-period-end notice + resume */}
        {subscription.cancelAtPeriodEnd && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] px-3 py-2 shadow-[2px_2px_0px_0px_#1e293b]" style={{ backgroundColor: colors.accentColor + '33' }}>
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: colors.accentColorDark }} />
              <span className="text-sm font-medium" style={{ color: colors.accentColorDark }}>
                Your subscription cancels on{' '}
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : 'end of billing period'}.
              </span>
            </div>
            <Button
              variant="themed"
              size="sm"
              loading={portal.isPending}
              onClick={() => portal.mutate()}
            >
              Resume Subscription
            </Button>
            <p className="text-xs text-[#64748b]">
              Changed your mind? Resume your subscription through the billing portal.
            </p>
          </div>
        )}
      </div>

      {canCancel && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowCancelModal(true)}
            className="text-sm text-[#64748b] underline decoration-1 underline-offset-2 hover:text-[#be123c] transition-colors"
          >
            Cancel subscription
          </button>
        </div>
      )}

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          cancelMutation.mutate(undefined, {
            onSuccess: () => setShowCancelModal(false),
          })
        }}
        isLoading={cancelMutation.isPending}
        periodEndDate={subscription?.currentPeriodEnd ?? null}
        planName={plan?.name ?? planTier ?? 'current'}
      />
    </Card>
  )
}
