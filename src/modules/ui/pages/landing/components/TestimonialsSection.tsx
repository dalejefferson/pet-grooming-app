import { useRef, useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Card } from '@/modules/ui/components/common'

const testimonials = [
  {
    quote: 'We cut our no-shows in half after switching to Sit Pretty Club. The automated reminders and easy online booking changed everything.',
    name: 'Sarah M.',
    business: 'Bark & Beyond',
    initials: 'SM',
    accentBorder: 'border-l-[#d1fae5]',
    avatarBg: 'bg-[#d1fae5]',
  },
  {
    quote: 'The calendar drag-and-drop is a dream. I used to spend 30 minutes arranging my day — now it takes seconds.',
    name: 'James T.',
    business: 'Fluffy Tails Spa',
    initials: 'JT',
    accentBorder: 'border-l-[#e9d5ff]',
    avatarBg: 'bg-[#e9d5ff]',
  },
  {
    quote: 'Finally, software that understands grooming salons. The pet profiles with vaccination tracking keep us compliant and our clients happy.',
    name: 'Maria L.',
    business: 'Paws & Relax',
    initials: 'ML',
    accentBorder: 'border-l-[#fef9c3]',
    avatarBg: 'bg-[#fef9c3]',
  },
]

export function TestimonialsSection() {
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
    <section id="testimonials" ref={ref} className="bg-[#f1f5f9] px-4 py-16 lg:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-[#1e293b]">Loved by groomers everywhere</h2>
          <p className="text-[#64748b]">See what salon owners are saying.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card
              key={t.name}
              colorVariant="white"
              padding="lg"
              className={`border-l-4 ${t.accentBorder} transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#1e293b] ${
                visible ? 'animate-slide-up opacity-100' : 'opacity-0'
              }`}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              {/* Stars */}
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-4 text-sm leading-relaxed text-[#334155] italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1e293b] ${t.avatarBg} shadow-[2px_2px_0px_0px_#1e293b]`}>
                  <span className="text-xs font-bold text-[#1e293b]">{t.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1e293b]">{t.name}</p>
                  <p className="text-xs text-[#64748b]">{t.business}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
