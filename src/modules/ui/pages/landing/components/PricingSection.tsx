import { useRef, useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Button, Card, Badge } from '@/modules/ui/components/common'

const tiers = [
  {
    name: 'Solo',
    monthlyPrice: 45,
    yearlyPrice: 432,
    description: 'Perfect for independent groomers and small shops.',
    highlighted: false,
    features: [
      '1 staff account',
      'Online booking portal',
      'Client & pet management',
      'Calendar (day/week/month views)',
      'Vaccination tracking & alerts',
      'Email appointment reminders',
      'Basic reporting dashboard',
    ],
  },
  {
    name: 'Studio',
    monthlyPrice: 95,
    yearlyPrice: 912,
    description: 'For growing salons that need the full toolkit.',
    highlighted: true,
    features: [
      'Everything in Solo, plus:',
      'Unlimited staff accounts',
      'Role-based permissions',
      'Dynamic service pricing with modifiers',
      'Advanced analytics with PDF & CSV export',
      'Due-for-grooming email reminders',
      'Staff scheduling & time-off management',
      'Performance tracking',
      'Priority support',
    ],
  },
]

export function PricingSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [isYearly, setIsYearly] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="pricing" ref={ref} className="px-4 py-16 lg:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-[#1e293b]">Simple, transparent pricing</h2>
          <p className="text-[#64748b]">No hidden fees. No long-term contracts. Cancel anytime.</p>

          {/* Monthly / Yearly toggle */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-white p-1 shadow-[2px_2px_0px_0px_#1e293b]">
            <button
              onClick={() => setIsYearly(false)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                !isYearly
                  ? 'bg-[#1e293b] text-white'
                  : 'text-[#334155] hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                isYearly
                  ? 'bg-[#1e293b] text-white'
                  : 'text-[#334155] hover:bg-gray-50'
              }`}
            >
              Yearly
              <span className="ml-1 rounded-md bg-[#d1fae5] px-1.5 py-0.5 text-xs font-bold text-[#166534]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {tiers.map((tier, i) => {
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice
            const perMonth = isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice

            return (
              <Card
                key={tier.name}
                colorVariant="white"
                padding="lg"
                className={`relative flex flex-col ${
                  tier.highlighted
                    ? 'border-[3px] border-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b]'
                    : ''
                } transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#1e293b] ${
                  visible ? 'animate-scale-in opacity-100' : 'opacity-0'
                }`}
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}

                <div className={tier.highlighted ? 'mt-2' : ''}>
                  <h3 className="text-xl font-bold text-[#1e293b]">{tier.name}</h3>
                  <p className="mt-1 text-sm text-[#64748b]">{tier.description}</p>
                </div>

                <div className="mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-[#1e293b]">${price}</span>
                  <span className="text-sm text-[#64748b]">/{isYearly ? 'year' : 'month'}</span>
                  {isYearly && (
                    <span className="ml-2 text-sm text-[#64748b]">(${perMonth}/mo)</span>
                  )}
                </div>

                <ul className="mb-8 flex flex-grow flex-col gap-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22c55e]" />
                      <span className="text-sm text-[#334155]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.highlighted ? 'themed' : 'outline'}
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    localStorage.setItem('pendingCheckout', JSON.stringify({
                      tier: tier.name.toLowerCase() as 'solo' | 'studio',
                      interval: isYearly ? 'yearly' : 'monthly',
                    }))
                    window.location.href = '/login'
                  }}
                >
                  Get Started
                </Button>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
