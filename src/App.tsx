import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppLayout, BookingLayout } from '@/components/layout'
import { LoginPage } from '@/pages/auth'
import {
  DashboardPage,
  CalendarPage,
  ClientsPage,
  ClientDetailPage,
  PetsPage,
  PetDetailPage,
  GroomersPage,
  ServicesPage,
  PoliciesPage,
  RemindersPage,
  ReportsPage,
  SettingsPage,
} from '@/pages/app'
import {
  BookingStartPage,
  BookingPetsPage,
  BookingIntakePage,
  BookingTimesPage,
  BookingConfirmPage,
  BookingSuccessPage,
} from '@/pages/book'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin app routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:clientId" element={<ClientDetailPage />} />
            <Route path="pets" element={<PetsPage />} />
            <Route path="pets/:petId" element={<PetDetailPage />} />
            <Route path="groomers" element={<GroomersPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Public booking routes */}
          <Route path="/book/:orgSlug" element={<BookingLayout />}>
            <Route index element={<Navigate to="start" replace />} />
            <Route path="start" element={<BookingStartPage />} />
            <Route path="pets" element={<BookingPetsPage />} />
            <Route path="intake" element={<BookingIntakePage />} />
            <Route path="times" element={<BookingTimesPage />} />
            <Route path="confirm" element={<BookingConfirmPage />} />
            <Route path="success" element={<BookingSuccessPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
