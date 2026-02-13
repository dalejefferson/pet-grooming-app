import {
  LandingNav,
  HeroSection,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
  LandingFooter,
} from './components'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  )
}
