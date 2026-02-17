import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/modules/database'
import { ThemeProvider, KeyboardProvider, UndoProvider, ShortcutTipsProvider, ToastProvider, SubscriptionProvider, OnboardingProvider } from '@/modules/ui/context'
import { ErrorBoundary, LoadingPage } from '@/modules/ui/components/common'
import { AppLayout, BookingLayout } from '@/modules/ui/components/layout'
import { LoginPage, AuthCallbackPage, ProtectedRoute, AuthProvider } from '@/modules/auth'
import { LandingPage } from '@/modules/ui/pages/landing'

// Lazy-loaded app pages
const DashboardPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.DashboardPage })))
const CalendarPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.CalendarPage })))
const ClientsPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.ClientsPage })))
const ClientDetailPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.ClientDetailPage })))
const PetsPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.PetsPage })))
const PetDetailPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.PetDetailPage })))
const ServicesPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.ServicesPage })))
const PoliciesPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.PoliciesPage })))
const RemindersPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.RemindersPage })))
const ReportsPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.SettingsPage })))
const StaffPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.StaffPage })))
const StaffDetailPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.StaffDetailPage })))
const BillingPage = lazy(() => import('@/modules/ui/pages/app').then(m => ({ default: m.BillingPage })))

// Lazy-loaded booking pages
const BookingStartPage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingStartPage })))
const BookingPetsPage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingPetsPage })))
const BookingGroomerPage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingGroomerPage })))
const BookingIntakePage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingIntakePage })))
const BookingTimesPage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingTimesPage })))
const BookingConfirmPage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingConfirmPage })))
const BookingSuccessPage = lazy(() => import('@/modules/ui/pages/book').then(m => ({ default: m.BookingSuccessPage })))

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ThemeProvider>
        <SubscriptionProvider>
        <BrowserRouter>
          <OnboardingProvider>
          <KeyboardProvider>
          <UndoProvider>
          <ToastProvider>
          <ShortcutTipsProvider>
          <Suspense fallback={<LoadingPage />}>
          <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Admin app routes - requires authentication */}
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="clients" element={<ProtectedRoute permission="canManageClients"><ClientsPage /></ProtectedRoute>} />
            <Route path="clients/:clientId" element={<ProtectedRoute permission="canManageClients"><ClientDetailPage /></ProtectedRoute>} />
            <Route path="pets" element={<ProtectedRoute permission="canManageClients"><PetsPage /></ProtectedRoute>} />
            <Route path="pets/:petId" element={<ProtectedRoute permission="canManageClients"><PetDetailPage /></ProtectedRoute>} />
            <Route path="groomers" element={<Navigate to="/app/staff" replace />} />
            <Route path="staff" element={<ProtectedRoute permission="canManageStaff"><StaffPage /></ProtectedRoute>} />
            <Route path="staff/:staffId" element={<ProtectedRoute permission="canManageStaff"><StaffDetailPage /></ProtectedRoute>} />
            <Route path="services" element={<ProtectedRoute permission="canManageServices"><ServicesPage /></ProtectedRoute>} />
            <Route path="policies" element={<ProtectedRoute permission="canManagePolicies"><PoliciesPage /></ProtectedRoute>} />
            <Route path="reminders" element={<ProtectedRoute permission="canManagePolicies"><RemindersPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute permission="canViewReports"><ReportsPage /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute permission="canManageSettings"><SettingsPage /></ProtectedRoute>} />
            <Route path="billing" element={<ProtectedRoute permission="canManageSettings"><BillingPage /></ProtectedRoute>} />
          </Route>

          {/* Public booking routes */}
          <Route path="/book/:orgSlug" element={<BookingLayout />}>
            <Route index element={<Navigate to="start" replace />} />
            <Route path="start" element={<BookingStartPage />} />
            <Route path="pets" element={<BookingPetsPage />} />
            <Route path="groomer" element={<BookingGroomerPage />} />
            <Route path="intake" element={<BookingIntakePage />} />
            <Route path="times" element={<BookingTimesPage />} />
            <Route path="confirm" element={<BookingConfirmPage />} />
            <Route path="success" element={<BookingSuccessPage />} />
          </Route>

          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
          </ShortcutTipsProvider>
          </ToastProvider>
          </UndoProvider>
          </KeyboardProvider>
          </OnboardingProvider>
        </BrowserRouter>
        </SubscriptionProvider>
      </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
