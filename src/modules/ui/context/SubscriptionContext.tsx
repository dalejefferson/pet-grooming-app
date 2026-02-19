import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSubscription } from '@/modules/database/hooks'
import type { Subscription, SubscriptionPlanTier, GatedFeature } from '@/modules/database/types'
import { FEATURE_TIER_MAP, tierSatisfies, getStaffLimit } from '@/config/subscriptionGates'
import { useGroomers } from '@/modules/database/hooks'
import { supabase } from '@/lib/supabase/client'
import { mapSubscription } from '@/modules/database/types/supabase-mappers'
import { subscribeToTestMode, getTestModeSnapshot } from '@/modules/auth/api/authApi'

interface SubscriptionContextValue {
  subscription: Subscription | null | undefined
  isLoading: boolean
  planTier: SubscriptionPlanTier | null
  isSubscriptionActive: boolean
  isTrialing: boolean
  trialDaysRemaining: number | null
  hasFeature: (feature: GatedFeature) => boolean
  devBypass: boolean
  staffCount: number
  canAddStaff: boolean
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  isLoading: true,
  planTier: null,
  isSubscriptionActive: false,
  isTrialing: false,
  trialDaysRemaining: null,
  hasFeature: () => false,
  devBypass: false,
  staffCount: 0,
  canAddStaff: false,
})

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: subscription, isLoading } = useSubscription()
  const testMode = useSyncExternalStore(subscribeToTestMode, getTestModeSnapshot)
  const devBypass = testMode || (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_SUBSCRIPTION === 'true')
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['subscription'], null)
          } else if (payload.new) {
            queryClient.setQueryData(
              ['subscription'],
              mapSubscription(payload.new as Record<string, unknown>)
            )
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  if (import.meta.env.PROD && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) {
    console.warn('WARNING: Using Stripe test key in production build')
  }

  const { data: groomers = [] } = useGroomers()

  const value = useMemo<SubscriptionContextValue>(() => {
    const planTier = subscription?.planTier ?? null
    const isSubscriptionActive = devBypass || (
      subscription != null && (
        subscription.status === 'trialing' ||
        subscription.status === 'active' ||
        subscription.status === 'past_due'
      )
    )
    const isTrialing = subscription?.status === 'trialing'

    let trialDaysRemaining: number | null = null
    if (isTrialing && subscription?.trialEnd) {
      // eslint-disable-next-line react-hooks/purity -- Date.now() is intentional for computing remaining trial days
      const msRemaining = new Date(subscription.trialEnd).getTime() - Date.now()
      trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
    }

    const hasFeature = (feature: GatedFeature): boolean => {
      if (devBypass) return true
      if (!isSubscriptionActive) return false
      const requiredTier = FEATURE_TIER_MAP[feature]
      return tierSatisfies(planTier, requiredTier)
    }

    const staffCount = groomers.length
    const canAddStaff = devBypass || staffCount < getStaffLimit(planTier)

    return {
      subscription,
      isLoading,
      planTier,
      isSubscriptionActive,
      isTrialing,
      trialDaysRemaining,
      hasFeature,
      devBypass,
      staffCount,
      canAddStaff,
    }
  }, [subscription, isLoading, devBypass, groomers])

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSubscriptionContext() {
  return useContext(SubscriptionContext)
}
