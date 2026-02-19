import { useRef, useState, useEffect } from 'react'
import { Calendar, Heart, TrendingUp, Mail, DollarSign, Shield } from 'lucide-react'
import { Card } from '@/modules/ui/components/common'

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Drag-and-drop calendar with day, week, and month views. Online booking portal lets clients self-serve 24/7.',
    color: 'mint' as const,
  },
  {
    icon: Heart,
    title: 'Complete Client & Pet Profiles',
    description: 'Track vaccination records, grooming history, behavior notes, coat types, and medical alerts. Everything your team needs at a glance.',
    color: 'lavender' as const,
  },
  {
    icon: TrendingUp,
    title: 'Team & Business Insights',
    description: 'Role-based staff management, dynamic service pricing, and analytics dashboards with PDF and CSV exports.',
    color: 'lemon' as const,
  },
  {
    icon: Mail,
    title: 'Email Notifications & Reminders',
    description: 'Automated appointment reminders, vaccination alerts, and ready-for-pickup emails. Keep clients informed without lifting a finger.',
    color: 'pink' as const,
  },
  {
    icon: DollarSign,
    title: 'Dynamic Service Pricing',
    description: 'Set base prices with smart modifiers for weight, coat type, breed, and add-ons. Every quote is accurate and automatic.',
    color: 'lime' as const,
  },
  {
    icon: Shield,
    title: 'Policies & Cancellation Management',
    description: 'Configure deposit rules, cancellation windows, and no-show fees. Protect your revenue with clear, enforceable policies.',
    color: 'peach' as const,
  },
]

export function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

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
    <section id="features" ref={ref} className="px-4 py-16 lg:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-[#1e293b]">Everything you need to run your salon</h2>
          <p className="text-[#64748b]">Powerful tools, beautifully simple.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              colorVariant={feature.color}
              padding="lg"
              className={`transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#1e293b] ${
                visible ? 'animate-slide-up opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b]">
                <feature.icon className="h-6 w-6 text-[#1e293b]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#1e293b]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#334155]">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
