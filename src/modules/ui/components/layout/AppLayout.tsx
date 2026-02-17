import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import { useKeyboardShortcuts, useTheme, validThemes, useOnboarding } from '../../context'
import { CreateAppointmentModal } from '../calendar'
import { TourOverlay } from '../onboarding'
import type { PetServiceSelection } from '../calendar'
import { useClients, useClientPets, useServices, useGroomers, useCreateAppointment, useCurrentUser } from '@/hooks'
import type { AppointmentStatus } from '@/types'

// Custom hook to detect mobile breakpoint
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

// Sidebar routes for keyboard navigation (static, defined outside component to avoid dependency issues)
const sidebarRoutes = [
  '/app/dashboard',
  '/app/calendar',
  '/app/clients',
  '/app/pets',
  '/app/staff',
  '/app/services',
  '/app/policies',
  '/app/reminders',
  '/app/reports',
  '/app/settings'
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const isMobile = useIsMobile()
  const location = useLocation()
  const { isTourActive } = useOnboarding()
  const { registerSidebarToggle, registerCalendarNavigate, registerBookAppointment, registerSidebarNavigate, registerThemeCycle, registerTourActive } = useKeyboardShortcuts()
  const { currentTheme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()

  const effectiveSidebarCollapsed = isTourActive ? false : sidebarCollapsed

  // Sync tour active state with keyboard context
  useEffect(() => {
    registerTourActive(isTourActive)
  }, [isTourActive, registerTourActive])

  const navigateSidebar = useCallback((direction: 'up' | 'down') => {
    const currentIndex = sidebarRoutes.indexOf(location.pathname)
    let newIndex: number

    if (currentIndex === -1) {
      newIndex = 0
    } else if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : sidebarRoutes.length - 1
    } else {
      newIndex = currentIndex < sidebarRoutes.length - 1 ? currentIndex + 1 : 0
    }

    navigate(sidebarRoutes[newIndex])
  }, [location.pathname, navigate])

  // Data hooks for the booking modal
  const { data: clients = [] } = useClients()
  const { data: allPets = [] } = useClientPets(selectedClientId)
  const { data: services = [] } = useServices()
  const { data: groomers = [] } = useGroomers()
  const createAppointment = useCreateAppointment()

  // Create a stable calendar navigate callback
  const goToCalendar = useCallback(() => {
    navigate('/app/calendar')
  }, [navigate])

  // Create a stable toggle callback
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  // Create a stable book appointment callback
  const openBookAppointment = useCallback(() => {
    setShowBookModal(true)
  }, [])

  // Create a stable theme cycle callback
  const cycleTheme = useCallback(() => {
    const currentIndex = validThemes.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % validThemes.length
    setTheme(validThemes[nextIndex])
  }, [currentTheme, setTheme])

  // Handle appointment creation
  const handleCreateAppointment = async (data: { clientId: string; petServices: PetServiceSelection[]; groomerId: string; notes: string; startTime: string; endTime: string }) => {
    try {
      await createAppointment.mutateAsync({
        organizationId: currentUser?.organizationId || '',
        clientId: data.clientId,
        pets: data.petServices.filter((ps) => ps.serviceIds.length > 0).map((ps) => ({
          petId: ps.petId,
          services: ps.serviceIds.map((serviceId) => {
            const service = services.find((s) => s.id === serviceId)
            return { serviceId, appliedModifiers: [], finalDuration: service?.baseDurationMinutes || 60, finalPrice: service?.basePrice || 0 }
          }),
        })),
        groomerId: data.groomerId || undefined,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        status: 'confirmed' as AppointmentStatus,
        internalNotes: data.notes || undefined,
        depositPaid: false,
        totalAmount: data.petServices.reduce((total, ps) => total + ps.serviceIds.reduce((sum, sid) => sum + (services.find((s) => s.id === sid)?.basePrice || 0), 0), 0),
      })
      setShowBookModal(false)
    } catch { /* Error handled by react-query */ }
  }

  // Register keyboard shortcuts with keyboard context
  useEffect(() => {
    registerSidebarToggle(toggleSidebar)
    registerCalendarNavigate(goToCalendar)
    registerBookAppointment(openBookAppointment)
    registerThemeCycle(cycleTheme)
  }, [registerSidebarToggle, registerCalendarNavigate, registerBookAppointment, registerThemeCycle, toggleSidebar, goToCalendar, openBookAppointment, cycleTheme])

  // Register sidebar navigation keyboard shortcut
  useEffect(() => {
    registerSidebarNavigate(navigateSidebar)
  }, [registerSidebarNavigate, navigateSidebar])

  // Close mobile sidebar when route changes (desktop sidebar state is user-controlled)
  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate: sync sidebar UI on mobile route change
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen, isMobile])

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:border-2 focus:border-[#1e293b] focus:rounded-xl focus:shadow-[3px_3px_0px_0px_#1e293b] focus:text-[#1e293b] focus:font-semibold"
      >
        Skip to main content
      </a>
      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Mobile sidebar backdrop - overlay on content, not pushing it */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
            onClick={handleCloseSidebar}
            aria-hidden="true"
          />
        )}

        {/* Desktop Sidebar - always visible */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={effectiveSidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar - slide-out drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar
            collapsed={false}
            onToggle={() => {}}
            isMobile={true}
            onClose={handleCloseSidebar}
          />
        </div>

        {/* Main content */}
        <div
          className={cn(
            'min-h-screen transition-all duration-300',
            // Only add left padding on desktop
            effectiveSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Book Appointment Modal */}
      <CreateAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        clients={clients}
        clientPets={allPets}
        services={services}
        groomers={groomers}
        initialStartTime=""
        initialEndTime=""
        onClientChange={setSelectedClientId}
        selectedClientId={selectedClientId}
        onCreateAppointment={handleCreateAppointment}
        isCreating={createAppointment.isPending}
      />

      <TourOverlay />
    </>
  )
}
