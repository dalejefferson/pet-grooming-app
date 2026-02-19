import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dog, Menu, X } from 'lucide-react'
import { Button } from '@/modules/ui/components/common'

export function LandingNav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'border-b-2 border-[#1e293b] bg-white shadow-[0_2px_0_0_#1e293b]'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-[#d1fae5] shadow-[2px_2px_0px_0px_#1e293b]">
            <Dog className="h-5 w-5 text-[#1e293b]" />
          </div>
          <span className="text-lg font-extrabold text-[#1e293b]">Sit Pretty Club</span>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          <button onClick={() => scrollTo('features')} className="text-sm font-semibold text-[#334155] hover:text-[#1e293b]">
            Features
          </button>
          <button onClick={() => scrollTo('pricing')} className="text-sm font-semibold text-[#334155] hover:text-[#1e293b]">
            Pricing
          </button>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Log In
          </Button>
          <Button variant="themed" size="sm" onClick={() => navigate('/login')}>
            Get Started
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t-2 border-[#1e293b] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button onClick={() => scrollTo('features')} className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#334155] hover:bg-[#d1fae5]">
              Features
            </button>
            <button onClick={() => scrollTo('pricing')} className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#334155] hover:bg-[#d1fae5]">
              Pricing
            </button>
            <hr className="border-[#1e293b]/20" />
            <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="w-full">
              Log In
            </Button>
            <Button variant="themed" size="sm" onClick={() => navigate('/login')} className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
