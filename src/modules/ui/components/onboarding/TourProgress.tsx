export interface TourProgressProps {
  currentStep: number
  totalSteps: number
}

export function TourProgress({ currentStep, totalSteps }: TourProgressProps) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === currentStep
        const isCompleted = i < currentStep

        return (
          <div
            key={i}
            className={`rounded-full border border-[#1e293b] transition-all duration-200 ${
              isActive
                ? 'w-6 h-2.5'
                : 'w-2.5 h-2.5'
            } ${
              !isActive && !isCompleted ? 'bg-gray-200' : ''
            }`}
            style={
              isActive
                ? { backgroundColor: 'var(--accent-color-dark)' }
                : isCompleted
                  ? { backgroundColor: 'var(--accent-color)' }
                  : undefined
            }
            aria-label={
              isActive
                ? `Step ${i + 1} of ${totalSteps}, current`
                : isCompleted
                  ? `Step ${i + 1} of ${totalSteps}, completed`
                  : `Step ${i + 1} of ${totalSteps}`
            }
          />
        )
      })}
    </div>
  )
}
