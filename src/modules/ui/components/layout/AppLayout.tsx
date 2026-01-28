import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import { useKeyboardShortcuts } from '../../context'
import { CreateAppointmentModal } from '../calendar'
import type { PetServiceSelection } from '../calendar'
import { useClients, useClientPets, useServices, useGroomers, useCreateAppointment } from '@/hooks'
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

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const isMobile = useIsMobile()
  const location = useLocation()
  const { registerSidebarToggle, registerBookAppointment, registerSidebarNavigate } = useKeyboardShortcuts()
  const navigate = useNavigate()

  // Sidebar routes for keyboard navigation
  const sidebarRoutes = [
    '/app/dashboard',
    '/app/calendar',
    '/app/clients',
    '/app/pets',
    '/app/groomers',
    '/app/services',
    '/app/policies',
    '/app/reminders',
    '/app/reports',
    '/app/settings'
  ]

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

  // Create a stable toggle callback
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  // Create a stable book appointment callback
  const openBookAppointment = useCallback(() => {
    setShowBookModal(true)
  }, [])

  // Handle appointment creation
  const handleCreateAppointment = async (data: { clientId: string; petServices: PetServiceSelection[]; groomerId: string; notes: string; startTime: string; endTime: string }) => {
    try {
      await createAppointment.mutateAsync({
        organizationId: 'org-1',
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
    registerBookAppointment(openBookAppointment)
  }, [registerSidebarToggle, registerBookAppointment, toggleSidebar, openBookAppointment])

  // Register sidebar navigation keyboard shortcut
  useEffect(() => {
    registerSidebarNavigate(navigateSidebar)
  }, [registerSidebarNavigate, navigateSidebar])

  // Close mobile sidebar when route changes (desktop sidebar state is user-controlled)
  useEffect(() => {
    if (isMobile) {
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
            collapsed={sidebarCollapsed}
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
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main>
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
    </>
  )
}
