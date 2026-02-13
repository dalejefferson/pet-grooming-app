import type { ReactNode } from 'react'
import { useSubscriptionContext } from '../../context/SubscriptionContext'
import type { GatedFeature } from '@/modules/database/types'
import { FEATURE_LABELS } from '@/config/subscriptionGates'
import { useCreateCheckoutSession } from '@/modules/database/hooks'
import { Card, CardTitle } from './Card'
import { Button } from './Button'
import { Lock } from 'lucide-react'

export interface SubscriptionGateProps {
  feature: GatedFeature
  children: ReactNode
  fallback?: ReactNode
  silent?: boolean
}

export function SubscriptionGate({
  feature,
  children,
  fallback,
  silent = false,
}: SubscriptionGateProps) {
  const { hasFeature, isLoading, devBypass } = useSubscriptionContext()

  if (devBypass) return <>{children}</>

  if (isLoading) return null

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (silent) return null
  if (fallback) return <>{fallback}</>

  return <UpgradePrompt feature={feature} />
}

function UpgradePrompt({ feature }: { feature: GatedFeature }) {
  const label = FEATURE_LABELS[feature]
  const checkout = useCreateCheckoutSession()

  return (
    <Card colorVariant="lavender" padding="md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b]">
          <Lock className="h-5 w-5 text-[#1e293b]" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">{label.name}</CardTitle>
          <p className="mt-1 text-sm text-[#64748b]">{label.description}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-3"
            loading={checkout.isPending}
            onClick={() => checkout.mutate({ planTier: 'studio', billingInterval: 'monthly' })}
          >
            Upgrade to Studio
          </Button>
        </div>
      </div>
    </Card>
  )
}
