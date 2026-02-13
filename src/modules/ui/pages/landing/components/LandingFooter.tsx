import { Dog } from 'lucide-react'

export function LandingFooter() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="border-t-2 border-[#1e293b] bg-white px-4 py-12 lg:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-[#d1fae5] shadow-[2px_2px_0px_0px_#1e293b]">
              <Dog className="h-5 w-5 text-[#1e293b]" />
            </div>
            <span className="text-lg font-extrabold text-[#1e293b]">Sit Pretty Club</span>
          </div>
          <p className="text-sm text-[#64748b]">Pet grooming management, simplified.</p>
        </div>

        {/* Product */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#1e293b]">Product</h4>
          <ul className="flex flex-col gap-2">
            <li>
              <button onClick={() => scrollTo('features')} className="text-sm text-[#64748b] hover:text-[#1e293b]">
                Features
              </button>
            </li>
            <li>
              <button onClick={() => scrollTo('pricing')} className="text-sm text-[#64748b] hover:text-[#1e293b]">
                Pricing
              </button>
            </li>
            <li>
              <button onClick={() => scrollTo('testimonials')} className="text-sm text-[#64748b] hover:text-[#1e293b]">
                Testimonials
              </button>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#1e293b]">Company</h4>
          <ul className="flex flex-col gap-2">
            <li><span className="text-sm text-[#64748b]">About</span></li>
            <li><span className="text-sm text-[#64748b]">Contact</span></li>
            <li><span className="text-sm text-[#64748b]">Privacy Policy</span></li>
          </ul>
        </div>

        {/* Get Started */}
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#1e293b]">Get Started</h4>
          <ul className="flex flex-col gap-2">
            <li>
              <a href="/login" className="text-sm text-[#64748b] hover:text-[#1e293b]">Log In</a>
            </li>
            <li>
              <a href="/login" className="text-sm text-[#64748b] hover:text-[#1e293b]">Start Free Trial</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="mx-auto mt-10 max-w-6xl border-t border-[#1e293b]/10 pt-6">
        <p className="text-center text-xs text-[#94a3b8]">&copy; 2026 Sit Pretty Club. All rights reserved.</p>
      </div>
    </footer>
  )
}
