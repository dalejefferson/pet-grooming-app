import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TOUR_STEPS, type TourStep } from '@/modules/ui/components/onboarding'
import { usePermissions } from '@/modules/auth'
import { useCurrentUser } from '@/modules/auth/hooks/useAuth'

interface OnboardingContextType {
  isTourActive: boolean
  currentStepIndex: number
  currentStep: TourStep | null
  totalSteps: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

function getStorageKey(userId: string): string {
  return `tour_completed_${userId}`
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission } = usePermissions()
  const { data: currentUser } = useCurrentUser()
  const lastStepTime = useRef<number>(0)

  const filteredSteps = useMemo(() => {
    return TOUR_STEPS.filter(
      (step) => step.permission === null || hasPermission(step.permission)
    )
  }, [hasPermission])

  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const currentStep = filteredSteps[currentStepIndex] ?? null
  const totalSteps = filteredSteps.length

  const userId = currentUser?.id

  const markDone = useCallback(() => {
    if (userId) {
      localStorage.setItem(getStorageKey(userId), 'true')
    }
  }, [userId])

  const startTour = useCallback(() => {
    if (filteredSteps.length === 0) return
    setCurrentStepIndex(0)
    navigate(filteredSteps[0].page)
    setIsTourActive(true)
  }, [filteredSteps, navigate])

  const completeTour = useCallback(() => {
    setIsTourActive(false)
    markDone()
  }, [markDone])

  const nextStep = useCallback(() => {
    const now = Date.now()
    if (now - lastStepTime.current < 300) return
    lastStepTime.current = now

    if (currentStepIndex >= filteredSteps.length - 1) {
      completeTour()
      return
    }

    const nextIndex = currentStepIndex + 1
    const nextStepData = filteredSteps[nextIndex]
    const currentPage = filteredSteps[currentStepIndex]?.page

    setCurrentStepIndex(nextIndex)
    if (nextStepData.page !== currentPage) {
      navigate(nextStepData.page)
    }
  }, [currentStepIndex, filteredSteps, completeTour, navigate])

  const prevStep = useCallback(() => {
    const now = Date.now()
    if (now - lastStepTime.current < 300) return
    lastStepTime.current = now

    if (currentStepIndex <= 0) return

    const prevIndex = currentStepIndex - 1
    const prevStepData = filteredSteps[prevIndex]
    const currentPage = filteredSteps[currentStepIndex]?.page

    setCurrentStepIndex(prevIndex)
    if (prevStepData.page !== currentPage) {
      navigate(prevStepData.page)
    }
  }, [currentStepIndex, filteredSteps, navigate])

  const skipTour = useCallback(() => {
    setIsTourActive(false)
    markDone()
  }, [markDone])

  // Auto-start tour for first-time users
  useEffect(() => {
    if (!userId) return
    if (!location.pathname.startsWith('/app/')) return
    if (localStorage.getItem(getStorageKey(userId))) return

    const timer = setTimeout(() => {
      startTour()
    }, 800)

    return () => clearTimeout(timer)
    // Only run on mount / when userId becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const value = useMemo<OnboardingContextType>(
    () => ({
      isTourActive,
      currentStepIndex,
      currentStep,
      totalSteps,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
    }),
    [
      isTourActive,
      currentStepIndex,
      currentStep,
      totalSteps,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
    ]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext)
  if (context === null) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
