import { useState, useEffect } from 'react'
import { Card, CardTitle, Button, Badge, ConfirmDialog } from '../common'
import { useSubscriptionContext } from '../../context/SubscriptionContext'
import { useCreateCheckoutSession, useCreatePortalSession } from '@/modules/database/hooks'
import type { SubscriptionPlanTier, SubscriptionBillingInterval, SubscriptionStatus } from '@/modules/database/types'
import { CreditCard, ExternalLink, Crown, AlertTriangle, Zap } from 'lucide-react'
import { getStaffLimit } from '@/config/subscriptionGates'

const PLANS = [
  { tier: 'solo' as const, name: 'Solo', monthlyPrice: 45, yearlyPrice: 432, desc: 'For independent groomers' },
  { tier: 'studio' as const, name: 'Studio', monthlyPrice: 95, yearlyPrice: 912, desc: 'For growing salons' },
]

function getStatusBadge(status: SubscriptionStatus): { variant: 'success' | 'warning' | 'danger' | 'default' | 'primary'; label: string } {
  switch (status) {
    case 'active': return { variant: 'success', label: 'Active' }
    case 'trialing': return { variant: 'primary', label: 'Trial' }
    case 'past_due': return { variant: 'danger', label: 'Past Due' }
    case 'canceled': return { variant: 'default', label: 'Canceled' }
    default: return { variant: 'default', label: status }
  }
}

export function BillingSection() {
  const {
    subscription,
    planTier,
    isSubscriptionActive,
    isTrialing,
    trialDaysRemaining,
    isLoading,
    devBypass,
    staffCount,
  } = useSubscriptionContext()
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false)
  const checkout = useCreateCheckoutSession()
  const portal = useCreatePortalSession()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanTier>('solo')
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval>('monthly')

  // Auto-trigger checkout from landing page plan selection
  useEffect(() => {
    if (isLoading || isSubscriptionActive) return
    const raw = localStorage.getItem('pendingCheckout')
    if (!raw) return
    localStorage.removeItem('pendingCheckout')
    try {
      const { tier, interval } = JSON.parse(raw) as { tier: SubscriptionPlanTier; interval: SubscriptionBillingInterval }
      // Use setTimeout to avoid synchronous setState in effect body
      setTimeout(() => {
        setSelectedPlan(tier)
        setBillingInterval(interval)
        checkout.mutate({ planTier: tier, billingInterval: interval })
      }, 0)
    } catch {
      // Invalid data — ignore
    }
  }, [isLoading, isSubscriptionActive]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Billing</CardTitle>
        <p className="mt-2 text-sm text-gray-500">Loading billing information...</p>
      </Card>
    )
  }

  // Dev bypass indicator
  if (devBypass && !subscription) {
    return (
      <Card colorVariant="lemon">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#a16207]" />
          <CardTitle>Billing (Dev Bypass Active)</CardTitle>
        </div>
        <p className="mt-2 text-sm text-[#64748b]">
          Subscription gates are bypassed. All features are unlocked for development.
          Set <code className="rounded bg-gray-100 px-1 text-xs">VITE_DEV_BYPASS_SUBSCRIPTION=false</code> to test real gating.
        </p>
      </Card>
    )
  }

  // No subscription — show plan selection
  if (!subscription || subscription.status === 'canceled') {
    return (
      <Card>
        <CardTitle>Billing</CardTitle>
        {subscription?.status === 'canceled' && (
          <div className="mt-3 rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] px-4 py-3 shadow-[2px_2px_0px_0px_#1e293b]">
            <p className="text-sm font-medium text-[#a16207]">
              Welcome back! Your previous subscription ended
              {subscription.currentPeriodEnd
                ? ` on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : ''}.
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              Choose a plan below to reactivate your account.
            </p>
          </div>
        )}
        <p className="mt-2 text-sm text-[#64748b]">
          Choose a plan to get started. All plans include a 14-day free trial.
        </p>

        {/* Interval toggle */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`rounded-lg border-2 border-[#1e293b] px-3 py-1.5 text-sm font-semibold transition-all ${
              billingInterval === 'monthly'
                ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_0px_#1e293b]'
                : 'bg-white text-[#334155] hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`rounded-lg border-2 border-[#1e293b] px-3 py-1.5 text-sm font-semibold transition-all ${
              billingInterval === 'yearly'
                ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_0px_#1e293b]'
                : 'bg-white text-[#334155] hover:bg-gray-50'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs font-normal opacity-75">(Save 20%)</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.tier
            const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
            const perMonth = billingInterval === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice

            return (
              <button
                key={plan.tier}
                onClick={() => setSelectedPlan(plan.tier)}
                className={`flex flex-col rounded-xl border-2 border-[#1e293b] p-4 text-left transition-all ${
                  isSelected
                    ? 'bg-white shadow-[3px_3px_0px_0px_#1e293b] -translate-y-0.5'
                    : 'bg-white/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1e293b]'
                }`}
              >
                <span className="text-sm font-bold text-[#1e293b]">{plan.name}</span>
                <span className="text-xs text-[#64748b]">{plan.desc}</span>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-[#1e293b]">${price}</span>
                  <span className="text-xs text-[#64748b]">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
                  {billingInterval === 'yearly' && (
                    <span className="ml-1 text-xs text-[#64748b]">(${perMonth}/mo)</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <Button
          variant="primary"
          className="mt-4 w-full"
          loading={checkout.isPending}
          onClick={() => checkout.mutate({ planTier: selectedPlan, billingInterval })}
        >
          Start 14-Day Free Trial
        </Button>
        {checkout.isError && (
          <p className="mt-2 text-sm text-red-600">{checkout.error.message}</p>
        )}
      </Card>
    )
  }

  // Has subscription — show current plan info
  const plan = PLANS.find((p) => p.tier === planTier)
  const badge = getStatusBadge(subscription.status)

  return (
    <Card>
      <div className="flex items-start justify-between">
        <CardTitle>Billing</CardTitle>
        <Badge variant={badge.variant as 'success' | 'warning' | 'danger' | 'default' | 'primary'}>
          {badge.label}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {/* Current plan */}
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#1e293b]" />
          <span className="font-semibold text-[#1e293b]">{plan?.name ?? planTier} Plan</span>
          <span className="text-sm text-[#64748b]">
            ({subscription.billingInterval === 'yearly' ? 'Annual' : 'Monthly'})
          </span>
        </div>

        {/* Next billing date */}
        {isSubscriptionActive && subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
          <p className="text-sm text-[#64748b]">
            Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        {/* Trial countdown */}
        {isTrialing && trialDaysRemaining != null && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] px-3 py-2 shadow-[2px_2px_0px_0px_#1e293b]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#a16207]" />
            <span className="text-sm font-medium text-[#a16207]">
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

        {/* Cancellation notice + resume */}
        {subscription.cancelAtPeriodEnd && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] px-3 py-2 shadow-[2px_2px_0px_0px_#1e293b]">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#a16207]" />
              <span className="text-sm font-medium text-[#a16207]">
                Your subscription cancels on{' '}
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : 'end of billing period'}.
              </span>
            </div>
            <Button
              variant="primary"
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

        {/* Manage billing button */}
        <div className="pt-2">
          <Button
            variant="outline"
            loading={portal.isPending}
            onClick={() => {
              const soloLimit = getStaffLimit('solo')
              if (planTier === 'studio' && staffCount > soloLimit) {
                setShowDowngradeWarning(true)
              } else {
                portal.mutate()
              }
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
          {portal.isError && (
            <p className="mt-2 text-sm text-red-600">{portal.error.message}</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDowngradeWarning}
        onClose={() => setShowDowngradeWarning(false)}
        onConfirm={() => {
          setShowDowngradeWarning(false)
          portal.mutate()
        }}
        title="Staff Limit on Solo Plan"
        message={`The Solo plan allows 1 staff member, but you currently have ${staffCount}. If you downgrade, you'll need to deactivate ${staffCount - 1} staff member${staffCount - 1 > 1 ? 's' : ''}.`}
        confirmLabel="Continue to Billing"
        variant="warning"
      />
    </Card>
  )
}
