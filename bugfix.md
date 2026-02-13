# bugfix.md - Test Failures, Lint Errors & Missing Test Coverage

Generated: 2026-02-12

---

## Summary

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Unit Tests (`vitest`) | 3 failures / 48 total (45 pass) |
| ESLint | 98 errors, 1 warning across 24 files |
| Test Coverage | ~3% of source files (6 of ~215 files tested) |

---

## Part 1: Unit Test Failures (3 failures)

All in `src/modules/ui/components/common/Button.test.tsx`. The Button component was updated to neo-brutalist styles but the tests still assert old class names.

### Fix 1.1: "should apply primary variant styles by default" (line 36)
- **Expected:** `bg-primary-600`
- **Actual:** `bg-primary-500` (hover uses `bg-primary-600`)
- **Fix:** Change assertion to `bg-primary-500`

### Fix 1.2: "should apply secondary variant styles" (line 42)
- **Expected:** `bg-gray-100`
- **Actual:** Uses theme-based dynamic style with `hover:brightness-95`, no `bg-gray-100`
- **Fix:** Update assertion to match current secondary variant classes (theme variable-based background)

### Fix 1.3: "should apply outline variant styles" (line 48)
- **Expected:** `border-gray-300`
- **Actual:** `border-[#1e293b]` (ink border from neo-brutalist design)
- **Fix:** Change assertion to `border-[#1e293b]`

---

## Part 2: ESLint Errors (98 errors)

### 2A. CRITICAL: react-hooks/rules-of-hooks (16 errors)

Hooks called after early returns. This violates React's rules and can cause **runtime crashes**.

#### BookingTimesPage.tsx (12 errors)
Lines: 27, 28, 31, 34, 40, 41, 44, 63, 64, 67, 75, 82

Hooks called conditionally after a guard/early-return:
- `useActiveServices`, `useGroomers`, `useStaffAvailability`, `useTimeOffRequests`, `useAvailableSlotsForWeek`
- `useState`, `useMemo`

**Fix:** Move ALL hooks above the early return. Pass conditional data as disabled/enabled flags to hooks instead of calling them conditionally. For example:
```tsx
// BEFORE (broken):
if (!bookingState) return <Navigate to="../start" />
const { data: services } = useActiveServices(orgId)  // hook after return!

// AFTER (correct):
const { data: services } = useActiveServices(orgId)  // hook always called
if (!bookingState) return <Navigate to="../start" />
```

#### BookingIntakePage.tsx (4 errors)
Lines: 36, 37, 47, 110

Same pattern — `useActiveServices` and `useMemo` called after early return guard.

**Fix:** Same approach — move all hooks above any conditional returns.

---

### 2B. MEDIUM: react-hooks/set-state-in-effect (16 errors)

`setState` called synchronously inside `useEffect`. Causes cascading re-renders.

| File | Line | State setter |
|------|------|-------------|
| `useGoogleMapsLoader.ts` | 16 | `setLoadError()` |
| `BillingSection.tsx` | 46 | `setSelectedPlan()` |
| `CalendarToolbar.tsx` | 23 | `setMounted()` |
| `MonthEventWrapper.tsx` | 18 | `setIsTruncated()` |
| `AddressAutocomplete.tsx` | 38 | `setLocalValue()` |
| `ComboBox.tsx` | 34 | `setSearchTerm()` |
| `AddPaymentMethodModal.tsx` | 27 | `setCardNumber()` |
| `AppointmentStatusChart.tsx` | 47 | `setAnimated()` |
| `BookingContext.tsx` | 46 | `setCurrentStep()` |
| `CalendarPage.tsx` | 120, 128 | `setCalendarView()` |
| `CalendarPage.tsx` | 156, 163 | `setCalendarDate()` |
| `ClientDetailPage.tsx` | 51 | `setIsEditing()` |
| `PetDetailPage.tsx` | 56 | `setIsEditing()` |
| `ReportsPage.tsx` | 52 | `setDateRange()` |
| `BookingStartPage.tsx` | 33 | `setSelectedClient()` |

**Fix options (case by case):**
- For sync-to-prop patterns: use `useSyncExternalStore` or initialize state from prop directly
- For mount-only effects (`setMounted(true)`): use `useRef` instead of state
- For effects that sync local state to external changes: use controlled component pattern or derive from props

---

### 2C. LOW: @typescript-eslint/no-unused-vars (8 errors)

| File | Line | Variable |
|------|------|----------|
| `scripts/seed-supabase.ts` | 287 | `_key` |
| `scripts/seed-supabase.ts` | 459 | `_key` |
| `scripts/seed-supabase.ts` | 529 | `_key` |
| `scripts/seed-supabase.ts` | 558 | `_key` |
| `scripts/seed-supabase.ts` | 595 | `_key` |
| `scripts/seed-supabase.ts` | 880 | `_a`, `_p` |
| `LoginPage.tsx` | 25 | `err` |

**Fix:** Replace unused destructured vars with `_` (single underscore) or remove entirely. For `LoginPage.tsx` line 25, prefix with `_` → `_err`.

---

### 2D. LOW: react-refresh/only-export-components (5 errors)

Files that export both a Provider component and a hook from the same file:

| File | Line |
|------|------|
| `AuthContext.tsx` | 44 |
| `BookingContext.tsx` | 17 |
| `KeyboardContext.tsx` | 6 |
| `ShortcutTipsContext.tsx` | 6 |
| `ThemeContext.tsx` | 215 |
| `UndoContext.tsx` | 14 |

**Fix:** Add `// eslint-disable-next-line react-refresh/only-export-components` above each hook export, OR move hooks to separate files. The disable comment is acceptable here — co-locating context + hook is a standard React pattern.

---

### 2E. LOW: no-constant-binary-expression (1 error)

| File | Line |
|------|------|
| `src/lib/utils.test.ts` | 11 |

**Fix:** Inspect the test assertion at line 11 — likely a `true && ...` or string concatenation that's always truthy. Rewrite the expression.

---

## Part 3: Missing Tests — What to Write

Current coverage: **6 test files covering ~3% of source code**. Existing tests cover Button, Input, feature flags, utility formatters, and types. All business-critical logic is untested.

### Priority 1: Critical Business Logic (write first)

#### 3.1 Validators (`src/modules/database/api/validators.ts`)
Tests needed:
- `validateMaxPetsPerAppointment()` — enforces pet limit, returns error when exceeded
- `validateAdvanceBooking()` — min/max advance booking hours
- `validateCancellationWindow()` — cancellation timing, late cancellation detection
- `validateVaccinationStatus()` — expired vaccination blocking
- `validateAppointmentDuration()` — max duration enforcement (default 480 min)
- `validatePetOwnership()` — client owns the pet being booked

Why: Pure functions, easy to test, enforce ALL booking business rules.

#### 3.2 Status Machine (`src/modules/database/api/statusMachine.ts`)
Tests needed:
- Valid transitions: requested→confirmed→checked_in→in_progress→completed
- Invalid transitions: completed→anything, cancelled→anything
- `canTransitionTo()` returns correct boolean
- Edge cases: same-status transitions, unknown statuses

Why: Pure function, critical for appointment workflow correctness.

#### 3.3 Subscription Gates (`src/config/subscriptionGates.ts`)
Tests needed:
- `tierSatisfies('solo', 'solo')` → true
- `tierSatisfies('studio', 'solo')` → true
- `tierSatisfies('solo', 'studio')` → false
- `tierSatisfies(null, 'solo')` → false
- All features in FEATURE_TIER_MAP mapped to correct tier

Why: Pure function, controls monetization logic.

#### 3.4 Vaccination Utils (`src/lib/utils/vaccinationUtils.ts`)
Tests needed:
- `getVaccinationStatus()` — expired, expiring_7, expiring_30, valid thresholds
- `getDaysUntilExpiration()` — date math accuracy
- `getPetVaccinationStatus()` — worst-status aggregation across multiple vaccinations
- `canBookPet()` — returns false when expired

Why: Pure functions, health compliance enforcement.

#### 3.5 Contrast Utils (`src/lib/utils/contrast.ts`)
Tests needed:
- `hexToRgb()` — 3-digit hex, 6-digit hex, invalid input
- `luminance()` — known values (black=0, white=1)
- `contrastRatio()` — known pairs (black/white=21)
- `meetsContrast()` — AA threshold (4.5:1), AAA threshold (7:1)

Why: Pure functions, WCAG accessibility compliance.

### Priority 2: Integration Logic (write second)

#### 3.6 Calendar API (`src/modules/database/api/calendarApi.ts`)
Tests needed (requires Supabase mocking):
- `getAvailableSlots()` — conflict detection, buffer time, break overlap, working hours
- `updateStatus()` — calls validateStatusTransition, enforces cancellation window
- `create()` — nested insert (appointments + appointment_pets + appointment_services)

Why: Core scheduling logic. Bugs = double bookings, lost appointments.

#### 3.7 Booking API (`src/modules/database/api/bookingApi.ts`)
Tests needed (requires Supabase mocking):
- `createBooking()` — new client path, existing client path, deposit enforcement, policy checks
- `calculateAppointmentDetails()` — price calculation with modifiers, duration summing

Why: Revenue-critical path. Handles money and creates permanent records.

#### 3.8 Supabase Mappers (`src/modules/database/types/supabase-mappers.ts`)
Tests needed:
- All `map*()` functions — correct snake_case→camelCase mapping
- All `toDb*()` functions — correct camelCase→snake_case mapping
- Null/undefined handling for optional fields
- Enum casting safety (PetSpecies, AppointmentStatus, etc.)

Why: Data corruption if mappings are wrong. Every DB read/write goes through these.

### Priority 3: Auth & Permissions (write third)

#### 3.9 usePermissions hook
Tests needed:
- Admin gets all permissions
- Groomer gets limited permissions (own appointments, clients)
- Receptionist gets calendar + clients + booking
- `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()` logic

#### 3.10 ProtectedRoute component
Tests needed:
- Renders children when authenticated + authorized
- Redirects to /login when not authenticated
- Redirects to /app/dashboard when missing permission
- Loading state renders correctly

#### 3.11 SubscriptionContext
Tests needed:
- `hasFeature()` returns true for active subscription with correct tier
- `hasFeature()` returns false for lower tier
- Dev bypass enables all features
- Trial days remaining calculated correctly
- `isSubscriptionActive` for trialing/active/past_due statuses

### Priority 4: Component Tests (write last)

#### 3.12 SubscriptionGate component
- Renders children when feature available
- Shows upgrade prompt when feature locked
- Silent mode hides prompt
- Loading state handling

#### 3.13 ErrorBoundary component
- Catches render errors, shows fallback UI
- Reset button works
- Nested errors handled

#### 3.14 BookingContext
- Session storage persistence (save/restore on refresh)
- `updateBookingState()` merges partial updates
- `resetBookingState()` clears everything

---

## Execution Plan

### Phase 1: Fix Failing Tests (30 min)
1. Update 3 assertions in `Button.test.tsx` to match current neo-brutalist styles

### Phase 2: Fix Critical Lint Errors (2-3 hours)
2. Fix `BookingTimesPage.tsx` — move 12 hooks above early returns
3. Fix `BookingIntakePage.tsx` — move 4 hooks above early returns
4. Fix 16 `set-state-in-effect` warnings across 14 files
5. Fix 8 unused vars in seed script + LoginPage

### Phase 3: Fix Low-Priority Lint (30 min)
6. Add eslint-disable comments for 5 `react-refresh/only-export-components` in context files
7. Fix 1 `no-constant-binary-expression` in utils.test.ts

### Phase 4: Write Critical Tests (4-6 hours)
8. Write tests for `validators.ts` (~15-20 test cases)
9. Write tests for `statusMachine.ts` (~10-12 test cases)
10. Write tests for `subscriptionGates.ts` (~8-10 test cases)
11. Write tests for `vaccinationUtils.ts` (~12-15 test cases)
12. Write tests for `contrast.ts` (~10-12 test cases)

### Phase 5: Write Integration Tests (4-6 hours)
13. Write tests for `calendarApi.ts` key functions (~15-20 test cases, needs Supabase mock)
14. Write tests for `bookingApi.ts` key functions (~12-15 test cases, needs Supabase mock)
15. Write tests for `supabase-mappers.ts` (~20-25 test cases)

### Phase 6: Write Auth & Component Tests (3-4 hours)
16. Write tests for `usePermissions` (~10-12 test cases)
17. Write tests for `ProtectedRoute` (~6-8 test cases)
18. Write tests for `SubscriptionContext` (~8-10 test cases)
19. Write tests for `SubscriptionGate` (~5-6 test cases)
20. Write tests for `ErrorBoundary` (~4-5 test cases)
21. Write tests for `BookingContext` (~6-8 test cases)

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Test files | 6 | ~24 |
| Test cases | 48 | ~220-260 |
| Failing tests | 3 | 0 |
| ESLint errors | 98 | 0 |
| TypeScript errors | 0 | 0 |
| Coverage (est.) | ~3% | ~25-30% of critical paths |
