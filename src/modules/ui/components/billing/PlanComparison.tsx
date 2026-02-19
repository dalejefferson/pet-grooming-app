import { useState, useEffect } from 'react'
import { Card, CardTitle, Button, Badge, ConfirmDialog } from '../common'
import { useSubscriptionContext } from '../../context/SubscriptionContext'
import { useCreateCheckoutSession, useCreatePortalSession } from '@/modules/database/hooks'
import { FEATURE_LABELS, FEATURE_TIER_MAP, getStaffLimit } from '@/config/subscriptionGates'
import type { SubscriptionPlanTier, SubscriptionBillingInterval, GatedFeature } from '@/modules/database/types'
import { Check, Lock, Crown, Users } from 'lucide-react'
import { PLANS } from './plans'
import { useTheme } from '@/modules/ui/context/ThemeContext'

// Shared features included in ALL plans (not gated)
const SHARED_FEATURES = [
  'Calendar & Scheduling',
  'Client Management',
  'Pet Profiles',
  'Online Booking Portal',
  'Email Reminders',
  'Basic Reports',
]

const GATED_FEATURES = Object.keys(FEATURE_TIER_MAP) as GatedFeature[]

export function PlanComparison() {
  const { colors } = useTheme()
  const {
    planTier,
    isSubscriptionActive,
    staffCount,
  } = useSubscriptionContext()

  const checkout = useCreateCheckoutSession()
  const portal = useCreatePortalSession()
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval>('monthly')
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false)

  // Auto-trigger checkout from landing page
  useEffect(() => {
    if (isSubscriptionActive) return
    const raw = localStorage.getItem('pendingCheckout')
    if (!raw) return
    localStorage.removeItem('pendingCheckout')
    try {
      const { tier, interval } = JSON.parse(raw) as { tier: SubscriptionPlanTier; interval: SubscriptionBillingInterval }
      setTimeout(() => {
        setBillingInterval(interval)
        checkout.mutate({ planTier: tier, billingInterval: interval })
      }, 0)
    } catch {
      // Invalid data — ignore
    }
  }, [isSubscriptionActive]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlanAction = (targetTier: SubscriptionPlanTier) => {
    if (!isSubscriptionActive) {
      checkout.mutate({ planTier: targetTier, billingInterval })
      return
    }

    if (targetTier === 'solo' && planTier === 'studio') {
      const soloLimit = getStaffLimit('solo')
      if (staffCount > soloLimit) {
        setShowDowngradeWarning(true)
        return
      }
    }
    portal.mutate()
  }

  const getButtonProps = (targetTier: SubscriptionPlanTier) => {
    const isCurrent = isSubscriptionActive && planTier === targetTier
    if (isCurrent) {
      return { label: 'Current Plan', variant: 'secondary' as const, disabled: true }
    }
    if (!isSubscriptionActive) {
      return { label: 'Start 14-Day Free Trial', variant: 'themed' as const, disabled: false }
    }
    if (targetTier === 'studio') {
      return { label: 'Upgrade to Studio', variant: 'themed' as const, disabled: false }
    }
    return { label: 'Downgrade to Solo', variant: 'outline' as const, disabled: false }
  }

  return (
    <Card>
      <CardTitle>Compare Plans</CardTitle>
      <p className="mt-1 text-sm text-[#64748b]">
        All plans include a 14-day free trial. No credit card required to start.
      </p>

      {/* Interval toggle */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => setBillingInterval('monthly')}
          className={`rounded-lg border-2 border-[#1e293b] px-3 py-1.5 text-sm font-semibold transition-all ${
            billingInterval === 'monthly'
              ? 'shadow-[2px_2px_0px_0px_#1e293b]'
              : 'bg-white text-[#334155] hover:bg-gray-50'
          }`}
          style={billingInterval === 'monthly' ? { backgroundColor: colors.accentColorDark, color: 'var(--text-on-accent)' } : undefined}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval('yearly')}
          className={`rounded-lg border-2 border-[#1e293b] px-3 py-1.5 text-sm font-semibold transition-all ${
            billingInterval === 'yearly'
              ? 'shadow-[2px_2px_0px_0px_#1e293b]'
              : 'bg-white text-[#334155] hover:bg-gray-50'
          }`}
          style={billingInterval === 'yearly' ? { backgroundColor: colors.accentColorDark, color: 'var(--text-on-accent)' } : undefined}
        >
          Yearly
          <span className="ml-1 text-xs font-normal opacity-75">(Save 20%)</span>
        </button>
      </div>

      {/* Plan cards side by side */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const perMonth = billingInterval === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
          const buttonProps = getButtonProps(plan.tier)
          const isCurrent = isSubscriptionActive && planTier === plan.tier
          const isStudio = plan.tier === 'studio'
          const cardBg = isStudio ? colors.accentColor : colors.secondaryAccent

          return (
            <Card key={plan.tier} padding="md" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#1e293b]" />
                <span className="text-lg font-bold text-[#1e293b]">{plan.name}</span>
                {isCurrent && <Badge variant="primary">Current</Badge>}
              </div>
              <p className="mt-1 text-sm text-[#64748b]">{plan.desc}</p>

              {/* Pricing */}
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-[#1e293b]">${price}</span>
                <span className="text-sm text-[#64748b]">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
                {billingInterval === 'yearly' && (
                  <span className="ml-1 text-sm text-[#64748b]">(${perMonth}/mo)</span>
                )}
              </div>

              {/* Staff limit */}
              <div className="mt-3 flex items-center gap-2 text-sm text-[#334155]">
                <Users className="h-4 w-4" />
                <span>{plan.tier === 'solo' ? '1 staff member' : 'Unlimited staff'}</span>
              </div>

              {/* Feature list */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase text-[#64748b]">Features</p>
                {SHARED_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-[#334155]">
                    <Check className="h-4 w-4 shrink-0" style={{ color: colors.accentColorDark }} />
                    <span>{feature}</span>
                  </div>
                ))}
                {GATED_FEATURES.map((featureKey) => {
                  const requiredTier = FEATURE_TIER_MAP[featureKey]
                  const included = plan.tier === 'studio' || requiredTier !== 'studio'
                  const label = FEATURE_LABELS[featureKey]?.name ?? featureKey
                  return (
                    <div key={featureKey} className={`flex items-center gap-2 text-sm ${included ? 'text-[#334155]' : 'text-[#94a3b8]'}`}>
                      {included ? (
                        <Check className="h-4 w-4 shrink-0" style={{ color: colors.accentColorDark }} />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                      )}
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Action button */}
              <Button
                variant={buttonProps.variant}
                className="mt-4 w-full"
                disabled={buttonProps.disabled}
                loading={checkout.isPending || portal.isPending}
                onClick={() => handlePlanAction(plan.tier)}
              >
                {buttonProps.label}
              </Button>
            </Card>
          )
        })}
      </div>

      {checkout.isError && (
        <p className="mt-2 text-sm text-red-600">{checkout.error.message}</p>
      )}

      {/* Downgrade warning dialog */}
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
