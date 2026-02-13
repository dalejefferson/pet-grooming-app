import { Dog, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { Button, Badge } from '@/modules/ui/components/common'

export function HeroSection() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="px-4 pt-28 pb-16 lg:px-6 lg:pt-36 lg:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text */}
        <div className="animate-slide-up">
          <Badge variant="primary" className="mb-4">Now in Beta</Badge>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-[#1e293b] lg:text-5xl xl:text-6xl">
            Grooming management that&apos;s a cut above
          </h1>
          <p className="mb-8 max-w-lg text-lg text-[#64748b]">
            The all-in-one platform for pet grooming salons. Manage bookings, clients, pets, and staff — all from one beautifully simple dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="themed" size="lg" onClick={() => window.location.href = '/login'}>
              Start Your Free Trial
            </Button>
            <Button variant="outline" size="lg" onClick={scrollToFeatures}>
              See Features
            </Button>
          </div>
        </div>

        {/* CSS-only product mockup */}
        <div className="animate-scale-in relative mx-auto w-full max-w-md lg:max-w-none">
          {/* Main "screen" card */}
          <div className="rounded-2xl border-2 border-[#1e293b] bg-white p-4 shadow-[4px_4px_0px_0px_#1e293b]">
            {/* Browser dots */}
            <div className="mb-3 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#fce7f3] border border-[#1e293b]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#fef9c3] border border-[#1e293b]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#d1fae5] border border-[#1e293b]" />
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-[#94a3b8]">{d}</div>
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const colors = ['bg-[#d1fae5]','bg-[#fef9c3]','bg-[#e9d5ff]','bg-[#fce7f3]','bg-[#ecfccb]','bg-[#fed7aa]','bg-white']
                const color = i === 5 || i === 12 || i === 18 || i === 23
                  ? colors[i % 6]
                  : i % 3 === 0
                    ? colors[i % 6]
                    : 'bg-[#f8fafc]'
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg border border-[#1e293b]/10 ${color}`}
                  />
                )
              })}
            </div>
          </div>

          {/* Floating appointment card */}
          <div className="absolute -top-3 -right-3 rotate-3 rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] px-3 py-2 shadow-[3px_3px_0px_0px_#1e293b]">
            <div className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-[#1e293b]" />
              <span className="text-xs font-bold text-[#1e293b]">Bella - 10:00 AM</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-[#22c55e]" />
              <span className="text-[10px] font-semibold text-[#22c55e]">Confirmed</span>
            </div>
          </div>

          {/* Floating stats card */}
          <div className="absolute -bottom-3 -left-3 -rotate-2 rounded-xl border-2 border-[#1e293b] bg-[#d1fae5] px-3 py-2 shadow-[3px_3px_0px_0px_#1e293b]">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1e293b]" />
              <span className="text-xs font-bold text-[#1e293b]">24 Appointments</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#64748b]" />
              <span className="text-[10px] text-[#64748b]">This week</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
