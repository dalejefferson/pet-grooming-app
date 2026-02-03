import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/modules/database'
import { ThemeProvider, KeyboardProvider, UndoProvider, ShortcutTipsProvider, ToastProvider } from '@/modules/ui/context'
import { ErrorBoundary } from '@/modules/ui/components/common'
import { AppLayout, BookingLayout } from '@/modules/ui/components/layout'
import { LoginPage, AuthCallbackPage, ProtectedRoute, AuthProvider } from '@/modules/auth'
import {
  DashboardPage,
  CalendarPage,
  ClientsPage,
  ClientDetailPage,
  PetsPage,
  PetDetailPage,
  ServicesPage,
  PoliciesPage,
  RemindersPage,
  ReportsPage,
  SettingsPage,
  StaffPage,
  StaffDetailPage,
} from '@/modules/ui/pages/app'
import {
  BookingStartPage,
  BookingPetsPage,
  BookingGroomerPage,
  BookingIntakePage,
  BookingTimesPage,
  BookingConfirmPage,
  BookingSuccessPage,
} from '@/modules/ui/pages/book'

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <KeyboardProvider>
          <UndoProvider>
          <ToastProvider>
          <ShortcutTipsProvider>
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

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </ShortcutTipsProvider>
          </ToastProvider>
          </UndoProvider>
          </KeyboardProvider>
        </BrowserRouter>
      </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
