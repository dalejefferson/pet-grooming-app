import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useOnboarding } from '@/modules/ui/context/OnboardingContext'
import { useSpotlight } from './useSpotlight'
import { TourTooltip } from './TourTooltip'

const PAD = 8

function buildClipPath(rect: DOMRect): string {
  const x1 = rect.left - PAD
  const y1 = rect.top - PAD
  const x2 = rect.right + PAD
  const y2 = rect.bottom + PAD
  return `polygon(0% 0%, 0% 100%, ${x1}px 100%, ${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px, ${x1}px 100%, 100% 100%, 100% 0%)`
}

export function TourOverlay() {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useOnboarding()

  const { rect } = useSpotlight(currentStep?.target ?? null)
  const skipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour()
        e.preventDefault()
      }
      if (e.key === 'ArrowRight') {
        nextStep()
        e.preventDefault()
      }
      if (e.key === 'ArrowLeft') {
        prevStep()
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isTourActive, skipTour, nextStep, prevStep])

  // Auto-skip if target element not found after 3.5s
  useEffect(() => {
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current)

    if (isTourActive && currentStep && !rect) {
      skipTimeoutRef.current = setTimeout(() => {
        nextStep()
      }, 3500)
    }

    return () => {
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current)
    }
  }, [isTourActive, currentStep, rect, nextStep])

  if (!isTourActive || !currentStep) return null

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Dimmed backdrop with spotlight cutout */}
      <div
        className="bg-slate-900/50 tour-spotlight-transition"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          ...(rect ? { clipPath: buildClipPath(rect) } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Glow ring around spotlight target */}
      {rect && (
        <div
          className="tour-glow-pulse tour-spotlight-transition"
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 8,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Skip button */}
      <button
        onClick={skipTour}
        className="fixed top-5 right-5 z-[10002] flex items-center gap-1.5 rounded-xl border-2 border-[#1e293b] bg-white px-4 py-2 text-sm font-semibold text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]"
      >
        <X className="h-4 w-4" />
        Skip Tour
      </button>

      {/* Tour tooltip */}
      <TourTooltip
        step={currentStep}
        currentIndex={currentStepIndex}
        totalSteps={totalSteps}
        targetRect={rect}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      />
    </div>,
    document.body
  )
}
