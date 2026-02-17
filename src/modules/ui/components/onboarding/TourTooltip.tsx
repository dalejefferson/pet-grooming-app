import { useRef, useEffect, useState, useCallback } from 'react'
import { TourProgress } from './TourProgress'
import type { TourStep } from './tourSteps'

interface TourTooltipProps {
  step: TourStep
  currentIndex: number
  totalSteps: number
  targetRect: DOMRect | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

const TOOLTIP_WIDTH = 320 // w-80
const EDGE_PADDING = 16
const GAP = 12

function computePosition(
  placement: TourStep['preferredPlacement'],
  targetRect: DOMRect | null,
  tooltipHeight: number
) {
  if (!targetRect) {
    return {
      top: (window.innerHeight - tooltipHeight) / 2,
      left: (window.innerWidth - TOOLTIP_WIDTH) / 2,
    }
  }

  let top: number
  let left: number

  switch (placement) {
    case 'bottom':
      top = targetRect.bottom + GAP
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
      break
    case 'top':
      top = targetRect.top - tooltipHeight - GAP
      left = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2
      break
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.right + GAP
      break
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.left - TOOLTIP_WIDTH - GAP
      break
  }

  // Viewport clamping
  left = Math.max(EDGE_PADDING, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - EDGE_PADDING))
  top = Math.max(EDGE_PADDING, Math.min(top, window.innerHeight - tooltipHeight - EDGE_PADDING))

  return { top, left }
}

export function TourTooltip({
  step,
  currentIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipHeight, setTooltipHeight] = useState(200)

  const measureHeight = useCallback(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.getBoundingClientRect().height
      if (h > 0 && h !== tooltipHeight) {
        setTooltipHeight(h)
      }
    }
  }, [tooltipHeight])

  useEffect(() => {
    measureHeight()
  }, [measureHeight, step.id])

  const { top, left } = computePosition(step.preferredPlacement, targetRect, tooltipHeight)
  const isLastStep = currentIndex === totalSteps - 1

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10001] w-80 rounded-2xl border-2 border-[#1e293b] bg-white p-5 shadow-[4px_4px_0px_0px_#1e293b] tour-tooltip-enter"
      style={{ top, left }}
      role="dialog"
      aria-label={`Tour step ${currentIndex + 1} of ${totalSteps}: ${step.title}`}
    >
      <p className="text-xs font-semibold text-[#64748b] mb-1">
        Step {currentIndex + 1} of {totalSteps}
      </p>
      <h3 className="text-lg font-bold text-[#1e293b] mb-2">{step.title}</h3>
      <p className="text-sm text-[#334155] mb-4">{step.description}</p>
      <div className="mb-4">
        <TourProgress currentStep={currentIndex} totalSteps={totalSteps} />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-[#64748b] hover:text-[#1e293b] font-medium transition-colors cursor-pointer bg-transparent border-none"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="rounded-xl border-2 border-[#1e293b] bg-white px-4 py-2 text-sm font-semibold text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] transition-all"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl border-2 border-[#1e293b] px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_0px_#1e293b] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] transition-all"
            style={{
              backgroundColor: 'var(--accent-color-dark)',
              color: 'var(--text-on-accent)',
            }}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
