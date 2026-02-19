import {
  LandingNav,
  HeroSection,
  FeaturesSection,
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
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  )
}
