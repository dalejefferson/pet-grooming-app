# Pre-Backend Build Plan: Bug Fixes & UX Enhancements

**Status**: Ready to implement
**Total Issues**: 55 from MISSING.md
**Estimated Files**: ~45-50
**Priority**: Complete before Supabase/Stripe/PostHog/Resend integration

---

## Why This Matters Before Backend Integration

- **Tier 1** (Data/Architecture): Broken ID references will corrupt Supabase schema migration
- **Tier 2** (Business Logic): Rules must exist at API layer to map to database constraints
- **Tier 3** (Error Handling): Real network errors require robust feedback
- **Tier 4** (UX Polish): Better experience regardless of backend

---

## Phase 1: Seed Data ID Consolidation (CRITICAL)

**Priority**: CRITICAL - Blocks all other work
**Files**: 3 modified
**Risk**: High (data integrity)

### Problem
Two conflicting seed systems cause silent failures:
- `seed.ts` uses `user-X` IDs: `user-1` (Sarah), `user-2` (Mike), `user-3` (Lisa)
- `groomersApi.ts` has duplicate seed with `groomer-X` IDs: `groomer-1`, `groomer-2`, `groomer-3` (Emma - different person!), `groomer-4`
- `staffApi.ts` references `groomer-X` for availability
- Appointments reference `groomerId: 'user-2'` and `'user-3'`
- **Result**: Calendar groomer lookups fail, names don't display

### Solution
Make `seed.ts` the single source of truth. Remove duplicates.

### Files to Modify

**1. `src/modules/database/api/groomersApi.ts`** (132 lines → ~70 lines)
```tsx
// Remove lines 7-68 (entire seedGroomers array)
// Add import:
import { seedGroomers } from '../seed/seed'

// Line 71 already uses seedGroomers correctly
```

**2. `src/modules/database/api/staffApi.ts`** (314 lines → ~305 lines)
```tsx
// Line 26: Change staffId: 'groomer-1' → staffId: 'user-2' (Mike)
// Line 34: Change staffId: 'groomer-2' → staffId: 'user-3' (Lisa)
// Line 50: Remove avail-3 for groomer-3 (doesn't exist in seed.ts)
// Lines 62, 71: Update time-off staffId references to user-X
```

**3. `src/modules/database/seed/seed.ts`** (843 lines)
- No changes (validation only)
- Lines 785-842 already correct

### Verification
```bash
# Clear localStorage and reload
localStorage.clear()

# Navigate to /app/calendar
# ✓ Verify appointments show groomer names (not "Unknown")

# Navigate to /app/staff
# ✓ Verify list shows: Sarah (user-1), Mike (user-2), Lisa (user-3)

# Click Mike → verify availability exists
# Create new appointment → verify groomer dropdown shows correct names
```

---

## Phase 2: Toast Notification System (HIGH)

**Priority**: HIGH - Foundation for all feedback
**Files**: 6 (3 new, 3 modified)
**Risk**: Low

### Problem
- No success/error/warning toasts
- Mutations fail silently
- Only UndoContext has toast UI (delete-specific)
- No global error handling in queryClient

### Solution
Create generic ToastContext following UndoContext pattern.

### Files to Create

**1. `src/modules/ui/context/ToastContext.tsx`** (NEW - ~180 lines)
```tsx
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number // default 5000ms
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
}

// Bottom-right stacked toasts
// Auto-dismiss with animation
// Pastel neo-brutalist styling matching UndoContext
```

**2. `src/modules/ui/components/common/Toast.tsx`** (NEW - ~80 lines)
```tsx
// Individual toast component
// Color-coded: success=green, error=red, warning=yellow, info=blue
// Close button
// Fade animations
```

**3. `src/modules/ui/hooks/useToast.ts`** (NEW - ~10 lines)
```tsx
export { useToast } from '../context/ToastContext'
```

### Files to Modify

**4. `src/App.tsx`**
```tsx
<UndoProvider>
  <ToastProvider>  {/* ADD */}
    <ShortcutTipsProvider>
```

**5. `src/modules/database/config/queryClient.ts`** (12 lines → ~45 lines)
```tsx
import { MutationCache } from '@tanstack/react-query'

let toastCallback: ((title: string, message?: string) => void) | null = null

export function setGlobalErrorToast(callback: typeof toastCallback) {
  toastCallback = callback
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (toastCallback) {
        toastCallback(
          'Operation Failed',
          error instanceof Error ? error.message : 'An unexpected error occurred'
        )
      }
    },
  }),
  defaultOptions: { /* existing */ }
})
```

**6. `src/modules/ui/context/ToastContext.tsx`** (from step 1)
```tsx
// In ToastProvider: call setGlobalErrorToast(showError) on mount
```

### Verification
```bash
# Navigate to /app/clients
# Create/update/delete → verify success toasts bottom-right
# Trigger validation error → verify error toast
# Test multiple toasts stack correctly
# Verify auto-dismiss after 5s
```

---

## Phase 3: Confirmation Dialog Component (HIGH)

**Priority**: HIGH - Foundation for safe deletes
**Files**: 2 (1 new, 1 modified)
**Risk**: Low

### Problem
- Delete buttons execute immediately
- No confirmation for destructive actions
- Modal exists but no confirmation variant

### Solution
Create ConfirmDialog component wrapping Modal.

### Files to Create

**1. `src/modules/ui/components/common/ConfirmDialog.tsx`** (NEW - ~110 lines)
```tsx
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string // default: "Confirm"
  cancelLabel?: string // default: "Cancel"
  variant?: 'danger' | 'warning' | 'primary' // default: 'danger'
  isLoading?: boolean
}

// Wraps Modal component
// Cancel button (outline), Confirm button (variant-styled)
// Handles async onConfirm with loading state
// Closes on cancel or successful confirm
```

### Files to Modify

**2. `src/modules/ui/components/common/index.ts`**
```tsx
export { ConfirmDialog } from './ConfirmDialog'
```

### Verification
```bash
# Test danger/warning/primary variants
# Test async confirm with loading state
# Test cancel/ESC/backdrop closes dialog
```

---

## Phase 4: Appointment Status State Machine (HIGH)

**Priority**: HIGH - Prevent invalid state transitions
**Files**: 3 (1 new, 2 modified)
**Risk**: Medium (changes mutation behavior)
**Dependencies**: Phase 2 (toast for errors)

### Problem
- `calendarApi.updateStatus()` accepts any transition
- Can skip states (e.g., requested → completed)
- No validation

### Solution
Define VALID_TRANSITIONS map and enforce in updateStatus.

### Files to Create

**1. `src/modules/database/api/statusMachine.ts`** (NEW - ~70 lines)
```tsx
import type { AppointmentStatus } from '../types'

export const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // terminal state
  cancelled: [], // terminal state
  no_show: [], // terminal state
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(`Invalid status transition from "${from}" to "${to}"`)
    this.name = 'InvalidStatusTransitionError'
  }
}

export function validateStatusTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): void {
  const validNextStates = VALID_TRANSITIONS[currentStatus]
  if (!validNextStates.includes(newStatus)) {
    throw new InvalidStatusTransitionError(currentStatus, newStatus)
  }
}

export function canTransitionTo(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus)
}
```

### Files to Modify

**2. `src/modules/database/api/calendarApi.ts`** (345 lines → ~360 lines)
```tsx
import { validateStatusTransition } from './statusMachine'

// Update line 117 updateStatus method:
async updateStatus(id: string, status: AppointmentStatus, statusNotes?: string): Promise<Appointment> {
  await delay()
  const appointment = await this.getById(id)
  if (!appointment) {
    throw new Error('Appointment not found')
  }

  // ADD VALIDATION
  validateStatusTransition(appointment.status, status)

  return this.update(id, { status, statusNotes })
}
```

**3. `src/modules/database/api/index.ts`**
```tsx
export {
  VALID_TRANSITIONS,
  validateStatusTransition,
  canTransitionTo,
  InvalidStatusTransitionError
} from './statusMachine'
```

### Verification
```bash
# /app/calendar - find 'requested' appointment
# Try mark as 'completed' → error toast
# Mark as 'confirmed' → success
# Mark as 'checked_in' → success
# Try mark as 'requested' → error toast (can't go backward)
# Mark as 'in_progress' → success
# Mark as 'completed' → success
# Try change completed → error toast (terminal state)
```

---

## Phase 5: Business Logic Validation (HIGH)

**Priority**: HIGH - Enforce policies
**Files**: 4 (1 new, 3 modified)
**Risk**: Medium (changes mutation behavior)
**Dependencies**: Phase 2 (toast for errors)

### Problem
- No maxPetsPerAppointment enforcement
- No advance booking window validation
- No pet ownership validation
- No buffer time between appointments
- No cancellation window checks
- No vaccination expiry checks at API level

### Solution
Create validators module. Add validation to calendarApi and bookingApi.

### Files to Create

**1. `src/modules/database/api/validators.ts`** (NEW - ~250 lines)
```tsx
import type { BookingPolicies, Pet, Client, Appointment } from '../types'
import { differenceInHours, differenceInDays, parseISO, isPast } from 'date-fns'

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingValidationError'
  }
}

export function validateMaxPetsPerAppointment(
  petCount: number,
  policies: BookingPolicies
): void {
  if (petCount > policies.maxPetsPerAppointment) {
    throw new BookingValidationError(
      `Maximum ${policies.maxPetsPerAppointment} pets per appointment`
    )
  }
}

export function validateAdvanceBooking(
  appointmentTime: string,
  policies: BookingPolicies
): void {
  const now = new Date()
  const appointmentDate = parseISO(appointmentTime)
  const hoursUntil = differenceInHours(appointmentDate, now)
  const daysUntil = differenceInDays(appointmentDate, now)

  if (hoursUntil < policies.minAdvanceBookingHours) {
    throw new BookingValidationError(
      `Appointments must be booked at least ${policies.minAdvanceBookingHours} hours in advance`
    )
  }

  if (daysUntil > policies.maxAdvanceBookingDays) {
    throw new BookingValidationError(
      `Appointments cannot be booked more than ${policies.maxAdvanceBookingDays} days in advance`
    )
  }
}

export function validateCancellationWindow(
  appointment: Appointment,
  policies: BookingPolicies
): { canCancel: boolean; isLate: boolean; reason?: string } {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return { canCancel: false, isLate: false, reason: 'Appointment already finalized' }
  }

  const now = new Date()
  const appointmentTime = parseISO(appointment.startTime)
  const hoursUntil = differenceInHours(appointmentTime, now)

  if (isPast(appointmentTime)) {
    return { canCancel: false, isLate: false, reason: 'Cannot cancel past appointments' }
  }

  const isLate = hoursUntil < policies.cancellationWindowHours
  return { canCancel: true, isLate, reason: undefined }
}

export function validateVaccinationStatus(pets: Pet[]): {
  hasExpired: boolean
  expiredPets: string[]
} {
  const expiredPets: string[] = []
  const today = new Date()

  for (const pet of pets) {
    for (const vax of pet.vaccinations) {
      const expDate = parseISO(vax.expirationDate)
      if (isPast(expDate)) {
        expiredPets.push(pet.name)
        break
      }
    }
  }

  return {
    hasExpired: expiredPets.length > 0,
    expiredPets
  }
}

export function validatePetOwnership(
  pets: Pet[],
  clientId: string
): void {
  const wrongOwner = pets.find(p => p.clientId !== clientId)
  if (wrongOwner) {
    throw new BookingValidationError(
      `Pet "${wrongOwner.name}" does not belong to this client`
    )
  }
}
```

### Files to Modify

**2. `src/modules/database/api/calendarApi.ts`** (345 lines → ~410 lines)
```tsx
// In getAvailableSlots() after line 206 conflict check, ADD:
if (groomerId && groomerAvailability) {
  const bufferMinutes = groomerAvailability.bufferMinutesBetweenAppointments

  const hasBufferConflict = dayAppointments.some((apt) => {
    if (apt.groomerId !== groomerId) return false
    if (apt.status === 'cancelled' || apt.status === 'no_show') return false

    const aptStart = parseISO(apt.startTime)
    const aptEnd = parseISO(apt.endTime)
    const bufferEnd = addMinutes(aptEnd, bufferMinutes)

    // Check if slot starts before buffer ends
    return currentSlotStart < bufferEnd && slotEnd > aptStart
  })

  isDuringBreak = isDuringBreak || hasBufferConflict
}
```

**3. `src/modules/database/api/bookingApi.ts`** (256 lines → ~320 lines)
```tsx
import {
  validateMaxPetsPerAppointment,
  validateAdvanceBooking,
  validatePetOwnership
} from './validators'

// In createBooking() before line 113, ADD:
async createBooking(booking: BookingState): Promise<BookingResult> {
  await delay()

  const policies = await policiesApi.get(booking.organizationId)

  // Validate max pets
  validateMaxPetsPerAppointment(booking.selectedPets.length, policies)

  // Validate advance booking window
  if (booking.selectedTimeSlot) {
    const startTime = `${booking.selectedTimeSlot.date}T${booking.selectedTimeSlot.startTime}`
    validateAdvanceBooking(startTime, policies)
  }

  // Validate pet ownership for existing pets
  if (!booking.isNewClient && booking.clientId) {
    const existingPets: Pet[] = []
    for (const selectedPet of booking.selectedPets) {
      if (!selectedPet.isNewPet && selectedPet.petId) {
        const pet = await petsApi.getById(selectedPet.petId)
        if (pet) existingPets.push(pet)
      }
    }
    if (existingPets.length > 0) {
      validatePetOwnership(existingPets, booking.clientId)
    }
  }

  // Continue with existing logic...
}
```

**4. `src/modules/database/api/index.ts`**
```tsx
export {
  validateMaxPetsPerAppointment,
  validateAdvanceBooking,
  validateCancellationWindow,
  validateVaccinationStatus,
  validatePetOwnership,
  BookingValidationError
} from './validators'
```

### Verification
```bash
# Try booking with 4 pets (max 3) → error toast
# Try booking 2 hours from now → error toast (24h min)
# Try booking 90 days out → error toast (60 day max)
# Book with pet from different client → error toast
# Test buffer time: book 2 appointments 5 mins apart for same groomer
  → second slot should be unavailable
```

---

## Phase 6: Wire Toast & Confirmation into Mutations (MEDIUM)

**Priority**: MEDIUM - User feedback
**Files**: ~15 (5 hook files, ~10 page files)
**Risk**: Low
**Dependencies**: Phases 2, 3, 4, 5

### Problem
- Mutations succeed/fail silently
- No user feedback
- Delete buttons execute immediately

### Solution
Add success toasts to all mutation hooks. Add ConfirmDialog to all delete buttons.

### Files to Modify

**Mutation Hooks** (add success toasts):
1. `src/modules/database/hooks/useCalendar.ts`
2. `src/modules/database/hooks/useClients.ts`
3. `src/modules/database/hooks/usePets.ts`
4. `src/modules/database/hooks/useServices.ts`
5. `src/modules/database/hooks/useStaff.ts`

```tsx
// Pattern for each mutation:
import { useToast } from '@/modules/ui/hooks/useToast'

const { showSuccess } = useToast()

const createMutation = useMutation({
  mutationFn: api.create,
  onSuccess: () => {
    showSuccess('Client created successfully')
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  },
})

const updateMutation = useMutation({
  mutationFn: ({ id, data }) => api.update(id, data),
  onSuccess: () => {
    showSuccess('Client updated successfully')
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  },
})

const deleteMutation = useMutation({
  mutationFn: api.delete,
  onSuccess: () => {
    showSuccess('Client deleted successfully')
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  },
})
```

**Pages with Delete Buttons** (~10 files):
- `src/modules/ui/pages/app/ClientsPage.tsx`
- `src/modules/ui/pages/app/ClientDetailPage.tsx`
- `src/modules/ui/pages/app/PetsPage.tsx`
- `src/modules/ui/pages/app/PetDetailPage.tsx`
- `src/modules/ui/pages/app/ServicesPage.tsx`
- `src/modules/ui/pages/app/StaffPage.tsx`
- `src/modules/ui/pages/app/StaffDetailPage.tsx`
- (And others with delete actions)

```tsx
// Pattern for each page:
import { ConfirmDialog } from '@/modules/ui/components/common'

const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [itemToDelete, setItemToDelete] = useState<string | null>(null)
const deleteMutation = useDeleteClient() // or appropriate hook

// Replace direct delete with:
<Button
  variant="danger"
  onClick={() => {
    setItemToDelete(clientId)
    setDeleteConfirmOpen(true)
  }}
>
  Delete
</Button>

<ConfirmDialog
  isOpen={deleteConfirmOpen}
  onClose={() => setDeleteConfirmOpen(false)}
  onConfirm={async () => {
    await deleteMutation.mutateAsync(itemToDelete!)
    setDeleteConfirmOpen(false)
  }}
  title="Delete Client?"
  message="This will soft-delete the client. You can restore from history."
  variant="danger"
  isLoading={deleteMutation.isPending}
/>
```

### Verification
```bash
# Create/update operations → success toasts
# Delete operations → confirmation dialog → success toast + undo toast
# Test cancel in confirmation
# Verify error toasts on validation failures
```

---

## Phase 7: BookingContext Integration (MEDIUM)

**Priority**: MEDIUM - Architecture fix
**Files**: 9 (7 booking pages, 2 routing/context files)
**Risk**: Medium (state refactor)
**Dependencies**: Phase 2 (toast for errors)

### Problem
- BookingContext exists but is never used
- All booking pages use URL searchParams for state
- Fragile, risks URL length limits
- Won't translate to Supabase

### Solution
Wire BookingProvider into booking routes. Refactor pages to use context.

### Files to Modify

**1. `src/App.tsx`**
```tsx
import { BookingProvider } from '@/modules/ui/context/BookingContext'

// Wrap /book/:orgSlug/* routes with BookingProvider
<Route path="/book/:orgSlug" element={<BookingLayout />}>
  {/* Wrap children with BookingProvider */}
  <Route index element={<Navigate to="start" replace />} />
  <Route path="start" element={<BookingStartPage />} />
  {/* etc */}
</Route>
```

**2-8. Booking Pages** (remove URL params, use context):
- `src/modules/ui/pages/book/BookingStartPage.tsx` (~200 lines → ~150 lines)
- `src/modules/ui/pages/book/BookingPetsPage.tsx`
- `src/modules/ui/pages/book/BookingGroomerPage.tsx`
- `src/modules/ui/pages/book/BookingIntakePage.tsx`
- `src/modules/ui/pages/book/BookingTimesPage.tsx`
- `src/modules/ui/pages/book/BookingConfirmPage.tsx`
- `src/modules/ui/pages/book/BookingSuccessPage.tsx`

```tsx
// Pattern for each page:
import { useBookingContext } from '@/modules/ui/context/BookingContext'

const { bookingState, updateBookingState } = useBookingContext()

// REMOVE:
const searchParams = new URLSearchParams()
searchParams.set('client', JSON.stringify(clientInfo))
navigate(`/book/${orgSlug}/pets?${searchParams}`)

// REPLACE WITH:
updateBookingState({ clientInfo })
navigate(`/book/${orgSlug}/pets`)

// Read state:
const { clientInfo, selectedPets, selectedGroomerId } = bookingState
```

**9. `src/modules/ui/context/BookingContext.tsx`** (63 lines → ~90 lines)
```tsx
// Optional: Add sessionStorage persistence
useEffect(() => {
  const saved = sessionStorage.getItem('booking-state')
  if (saved) {
    try {
      setBookingState(JSON.parse(saved))
    } catch (e) {
      console.error('Failed to restore booking state', e)
    }
  }
}, [])

useEffect(() => {
  sessionStorage.setItem('booking-state', JSON.stringify(bookingState))
}, [bookingState])
```

### Verification
```bash
# Start at /book/paws-claws/start
# Enter client info → Continue
# ✓ URL has NO query params
# Add pet → Continue
# ✓ State persists through navigation
# Complete booking flow
# ✓ Success page shows correct data
# Go back to start → state is reset
# Test browser back button
# Refresh page mid-flow → state persists (sessionStorage)
```

---

## Phase 8: UX Polish & Enhancements (LOW)

**Priority**: LOW - Nice to have
**Files**: ~12 (5 new components, 7 page updates)
**Risk**: Low
**Dependencies**: All previous phases

### Problem
- No loading skeletons
- No empty states
- No search debouncing
- No focus traps
- No error boundaries

### Solution
Add polish components and patterns.

### Files to Create

**1. `src/modules/ui/components/common/Skeleton.tsx`** (NEW - ~80 lines)
```tsx
interface SkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'text'
  count?: number
}

export function Skeleton({ variant = 'card', count = 1 }: SkeletonProps) {
  // Card, list, table skeleton variants
  // Animated shimmer effect
  // Pastel neo-brutalist styling
}
```

**2. `src/modules/ui/components/common/EmptyState.tsx`** (NEW - ~60 lines)
```tsx
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  // Centered empty state with optional CTA button
  // Pastel neo-brutalist styling
}
```

**3. `src/modules/ui/components/common/ErrorBoundary.tsx`** (NEW - ~90 lines)
```tsx
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean; error: Error | null }> {
  // React Error Boundary
  // Shows friendly error page with reset button
  // Logs error to console
}
```

**4. `src/lib/utils/debounce.ts`** (NEW - ~20 lines)
```tsx
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

**5. `src/modules/ui/hooks/useFocusTrap.ts`** (NEW - ~60 lines)
```tsx
export function useFocusTrap(isActive: boolean) {
  // Custom hook for focus trap in modals
  // Tab cycles through focusable elements
  // Shift+Tab goes backward
  // Returns ref to attach to container
}
```

### Files to Modify

**6. `src/modules/ui/components/common/Modal.tsx`** (~94 lines → ~110 lines)
```tsx
import { useFocusTrap } from '@/modules/ui/hooks/useFocusTrap'

// In Modal component:
const modalRef = useFocusTrap(isOpen)

return (
  <div ref={modalRef} className="...">
    {/* existing content */}
  </div>
)
```

**7. `src/modules/ui/components/common/Drawer.tsx`**
```tsx
// Same pattern as Modal
import { useFocusTrap } from '@/modules/ui/hooks/useFocusTrap'
```

**8. `src/modules/ui/pages/app/ClientsPage.tsx`**
```tsx
import { debounce } from '@/lib/utils/debounce'
import { Skeleton, EmptyState } from '@/modules/ui/components/common'

// Add debounced search (300ms delay)
const debouncedSetSearch = useMemo(
  () => debounce((value: string) => setSearch(value), 300),
  []
)

// Replace LoadingSpinner:
{isLoading && <Skeleton variant="list" count={5} />}

// Add EmptyState when no results:
{!isLoading && filteredClients.length === 0 && (
  <EmptyState
    title="No clients found"
    description={search ? `No results for "${search}"` : "Add your first client to get started"}
    action={!search ? {
      label: "Add Client",
      onClick: () => setIsCreateModalOpen(true)
    } : undefined}
  />
)}
```

**9. `src/modules/ui/pages/app/PetsPage.tsx`**
```tsx
// Same pattern as ClientsPage:
// - Debounced search
// - Skeleton loading
// - EmptyState
```

**10. `src/modules/ui/pages/app/CalendarPage.tsx`**
```tsx
import { Skeleton, EmptyState } from '@/modules/ui/components/common'

// Add skeleton while loading:
{isLoading && <Skeleton variant="calendar" />}

// Add EmptyState for days with no appointments:
{!isLoading && dayAppointments.length === 0 && (
  <EmptyState
    title="No appointments today"
    description="Book your first appointment or select another day"
    action={{
      label: "Book Appointment",
      onClick: () => navigate('/app/calendar?new=true')
    }}
  />
)}
```

**11. `src/modules/ui/pages/app/ReportsPage.tsx`**
```tsx
// Add EmptyState for date ranges with no data:
{!isLoading && appointmentsData.length === 0 && (
  <EmptyState
    title="No data for this period"
    description="Try selecting a different date range"
  />
)}
```

**12. `src/App.tsx`**
```tsx
import { ErrorBoundary } from '@/modules/ui/components/common/ErrorBoundary'

// Wrap entire app:
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* rest of providers */}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
```

### Verification
```bash
# Navigate to /app/clients with slow network → skeleton appears
# Search for non-existent → EmptyState shows
# Type in search → verify 300ms debounce delay
# Open Modal → Tab cycles focus within modal
# Navigate to empty calendar day → EmptyState
# Throw test error → ErrorBoundary catches it
```

---

## Summary of Phases

| Phase | Priority | Files | Risk | Dependencies |
|-------|----------|-------|------|--------------|
| 1. Seed Data ID Fix | CRITICAL | 3 | High | None (BLOCKING) |
| 2. Toast System | HIGH | 6 | Low | None |
| 3. Confirm Dialog | HIGH | 2 | Low | Phase 2 |
| 4. Status Machine | HIGH | 3 | Medium | Phase 2 |
| 5. Business Validation | HIGH | 4 | Medium | Phase 2 |
| 6. Wire Toast/Confirm | MEDIUM | ~15 | Low | Phases 2,3,4,5 |
| 7. BookingContext | MEDIUM | 9 | Medium | Phase 2 |
| 8. UX Polish | LOW | ~12 | Low | All |
| **TOTAL** | | **~50 files** | | |

---

## Critical Path

1. **Phase 1 FIRST** - Data integrity blocking issue
2. **Phase 2** - Foundation for all error feedback
3. **Phases 3-5** in parallel (all depend on Phase 2)
4. **Phase 6** after 2-5 complete (wires everything together)
5. **Phase 7** anytime after Phase 2
6. **Phase 8** last (polish)

---

## Impact on Backend Integration

### What this fixes before Supabase:
- **Seed data IDs** → Clean schema migration, no orphaned references
- **Status transitions** → Map directly to database constraints or triggers
- **Business rules** → Translate to Postgres functions, RLS policies, or edge functions
- **Validation** → Reusable on frontend + backend

### What this improves for Stripe:
- **Error handling** → Payment failures show user feedback instead of silent errors
- **Confirmation dialogs** → Payment actions require explicit confirmation
- **Toast notifications** → Success feedback for completed payments

### What this enhances for PostHog:
- **Toast events** → Track success/error rates, identify friction points
- **Validation errors** → Measure which rules block users most
- **Empty states** → Understand where users get stuck

### What this prepares for Resend:
- **Notification patterns** → Toast system mirrors email notification UX
- **Error handling** → Email send failures surfaced to user
- **Success feedback** → Confirm email reminders sent

---

## Verification Strategy

Each phase has specific verification steps. General pattern:
1. Clear localStorage (for Phase 1 only)
2. Test happy path
3. Test error cases → verify error toasts
4. Test edge cases
5. Check browser console for errors
6. Test across multiple pages/flows
7. Test keyboard navigation and accessibility
