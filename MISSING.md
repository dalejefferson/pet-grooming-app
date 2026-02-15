# MISSING.md - App Completeness Audit

Last audited: 2026-02-15 (re-audited, run #3)

---

## Critical

- [x] [RESOLVED] [Critical] [A] Seed data ID mismatch: seedUsers uses `user-1/2/3`, seedGroomers uses `groomer-1/2/3/4` — fixed in groomersApi.ts, all IDs now consistent
- [x] [RESOLVED] [Critical] [A] Duplicate groomer seed data: groomersApi.ts had conflicting seedGroomers — removed, seed.ts is now single source of truth
- [x] [RESOLVED] [Critical] [A] Staff availability ID mismatch: staffApi.ts referenced wrong IDs — updated to match seed.ts user IDs
- [x] [RESOLVED] [Critical] [A] No error handling on mutations: ToastContext created, global error handler wired in queryClient.ts, all hook files updated
- [x] [RESOLVED] [Critical] [A] Empty catch blocks: CalendarPage.tsx lines 259 and 301 had `catch { /* Error handled by react-query */ }` which swallowed errors silently — removed try/catch wrappers so errors propagate to React Query's global MutationCache onError handler
- [x] [RESOLVED] [Critical] [A] No global error handling: queryClient.ts now has MutationCache with onError callback wired to ToastContext
- [x] [RESOLVED] [Critical] [A] Undefined variable `user` in ClientDetailPage PetForm: useCurrentUser hook was already imported and called — `user` is in scope, bug was previously fixed
- [ ] [Critical] [A] **NEW** Race condition in appointment slot booking: `getAvailableSlots()` checks conflicts at query time but no DB-level unique constraint or transaction locking when creating — two users can book the same slot simultaneously (calendarApi.ts lines 246-365)
- [ ] [Critical] [A] **NEW-R2** Double-click booking race condition: `handlePayment()` in BookingConfirmPage has no idempotency protection — user can click "Confirm Booking" multiple times during the 2-second payment simulation, creating duplicate appointments (BookingConfirmPage.tsx lines 173-230). Upgrade from Medium line 70.
- [ ] [Critical] [A] **NEW-R2** Booking intake allows 0 services per pet: no validation that at least 1 service is selected per pet before proceeding to payment — user can complete entire booking with empty services (BookingConfirmPage.tsx)
- [ ] [Critical] [A] **NEW-R2** No empty state for "no services available" in booking intake: when selected groomer has no compatible services, page shows nothing helpful — user sees blank screen (BookingIntakePage.tsx line 99)
- [ ] [Critical] [A] **NEW-R3** Subscription dev bypass warns but doesn't block in production: `VITE_DEV_BYPASS_SUBSCRIPTION=true` only `console.error`s in production builds — doesn't throw or prevent bypass. Any production build with this env var leaks all features for free (SubscriptionContext.tsx lines 38-39)

## High

- [x] [RESOLVED] [High] [A] No appointment conflict detection: calendarApi.getAvailableSlots() now checks overlapping appointments (lines 205-214)
- [x] [RESOLVED] [High] [A] Invalid status transitions: statusMachine.ts created with valid transition map, calendarApi.updateStatus() validates via validateStatusTransition()
- [x] [RESOLVED] [High] [A] Buffer time between appointments not enforced: calendarApi.getAvailableSlots() now implements buffer time checks (lines 229-247)
- [x] [RESOLVED] [High] [A] maxPetsPerAppointment policy not enforced: validators.ts created, bookingApi.createBooking() calls validateMaxPetsPerAppointment()
- [x] [RESOLVED] [High] [A] Cancellation window policy not enforced: validateCancellationWindow() now called in calendarApi.updateStatus() when status -> cancelled
- [x] [RESOLVED] [High] [A] newClientMode 'blocked' not enforced: early guard in bookingApi.createBooking() throws BookingValidationError before client creation
- [x] [RESOLVED] [High] [A] Vaccination expiration not checked on booking: validateVaccinationStatus() called in bookingApi.createBooking() lines 166-173, throws BookingValidationError for expired vaccinations
- [x] [RESOLVED] [High] [A] Expired payment cards can process: isCardExpired() check added to processPayment() in paymentMethodsApi.ts
- [x] [RESOLVED] [High] [A] Missing deposit validation: bookingApi.createBooking() now validates payment completed when deposit required
- [x] [RESOLVED] [High] [A] Service modifier silently skipped: calculateAppointmentDetails() now throws BookingValidationError when modifier not found
- [x] [RESOLVED] [High] [A] BookingContext partially unused: guard redirects added to all 5 booking step pages — redirect to start if prerequisite context data missing
- [x] [RESOLVED] [High] [A] No form validation with inline errors: shared formValidation.ts utility created, inline errors wired into ClientsPage and SettingsPage forms
- [x] [RESOLVED] [High] [A] No confirmation dialogs for destructive actions: ConfirmDialog.tsx created, wired into ClientsPage, PetsPage, ServicesPage
- [x] [RESOLVED] [High] [A] No success/error toast notifications for mutations: ToastContext created and wired into useCalendar, useClients, usePets, useServices, useStaff, useGroomers hooks
- [x] [RESOLVED] [High] [A] Calendar accessibility gaps: aria-labels added to CalendarPage, CustomEvent, CalendarToolbar; Drawer already has role=dialog
- [x] [RESOLVED] [High] [A] No cascading deletes: petsApi.delete() cascades to appointment_pets/services/vaccinations; groomersApi/staffApi.delete() unassigns appointments and cleans up availability/time-off
- [x] [RESOLVED] [High] [A] Empty petId fallback in bookingApi: throws BookingValidationError for missing petId on existing pets in both calculateAppointmentDetails() and createBooking()
- [x] [RESOLVED] [High] [A] No maximum appointment duration validation: validateAppointmentDuration() added to validators.ts, called in bookingApi.createBooking() (default max 480 min)
- [x] [RESOLVED] [High] [A] Payment status never updated post-booking: updatePaymentStatus() added to calendarApi + useCalendar hook + admin dropdown in AppointmentDetailsDrawer
- [ ] [High] [A] **NEW** No query error states displayed: React Query hooks return `isError`/`error` but no page checks or displays them — failed fetches show empty/loading state indefinitely (all pages: ClientsPage, PetsPage, StaffPage, ServicesPage, CalendarPage, DashboardPage, RemindersPage, ReportsPage)
- [ ] [High] [A] **NEW** Payment status not validated before completing appointment: `updateStatus()` allows transitioning to 'completed' without verifying payment is completed (calendarApi.ts lines 211-230)
- [ ] [High] [A] **NEW** No conflict detection when updating/dragging appointments: `update()` allows changing startTime/endTime/groomerId without re-checking availability (calendarApi.ts lines 199-209)
- [ ] [High] [A] **NEW** Service modifier deletion invalidates existing appointments: `removeModifier()` deletes modifiers still referenced in existing appointments' appliedModifiers arrays (servicesApi.ts lines 196-207)
- [ ] [High] [A] **NEW** CalendarPage has no loading state: fetches appointments, clients, pets, groomers, and services with no loading indicator — flash of empty calendar before data arrives
- [ ] [High] [A] **NEW** ReportsPage has no loading state: fetches multiple data sources but charts render with incomplete/undefined data during initial load
- [ ] [High] [A] **NEW-R3** ConfirmDialog silently swallows errors: try-catch block only does `console.error` — if delete/confirm action fails (network, permission), user sees no feedback and thinks it succeeded (ConfirmDialog.tsx lines 42-51)
- [ ] [High] [A] **NEW-R3** BookingStartPage setState in render anti-pattern: setting state during render (lines 31-34) instead of useEffect — causes React warnings and potential infinite loop
- [ ] [High] [A] **NEW-R3** CalendarPage email send failure silent: "ready for pickup" email errors only `console.warn` — user thinks email was sent when it wasn't (CalendarPage.tsx)
- [ ] [High] [A] **NEW-R3** StaffPage no confirmation dialog for deletion: staff members deleted without ConfirmDialog, unlike Clients/Pets/Services which all have one (StaffPage.tsx)
- [ ] [High] [A] **NEW-R3** ReportsPage CSV/PDF export failure silent: export functions have no try-catch or error toast — if export fails on large data, user gets no feedback (ReportsPage.tsx lines 307-331)
- [ ] [High] [A] **NEW-R3** Groomer break time validation fails for inverted times: `breakStart > breakEnd` (backwards) not checked — allows booking during actual break period (calendarApi.ts lines 344-352)
- [ ] [High] [B] Stripe integration is fully mocked: mockStripe.ts simulates payments — no real payment processing for bookings
- [ ] [High] [B] Email notifications are mocked: mockEmailService.ts logs to console/localStorage only — needs Resend integration for all notification types (confirmations, reminders, cancellations, vaccination alerts). Email-first strategy; SMS deferred to future phase.
- [ ] [High] [B] **NEW** RLS policies allow anonymous client creation: anonymous users can create clients and view client data (for booking flow) — abusable for data scraping or spamming (supabase/migrations/002_rls_policies.sql lines 77-82)

## Medium

- [ ] [Medium] [A] Soft delete restore creates new ID: historyApi.ts discards original ID on restore, orphaning all references (appointments, pets) to old ID
- [x] [RESOLVED] [Medium] [A] No pet-to-client validation in booking: validators.ts validatePetOwnership() created and called in bookingApi.createBooking()
- [ ] [Medium] [A] No input validation in APIs: empty strings, negative numbers, invalid emails all accepted (all API create/update functions)
- [ ] [Medium] [A] Time slot duration mismatch: getAvailableSlots() uses 30-min fixed intervals but doesn't account for actual appointment duration when checking conflicts (calendarApi.ts)
- [ ] [Medium] [A] No optimistic locking: concurrent edits to same entity cause lost updates (all API files)
- [ ] [Medium] [A] Groomer availability auto-creates for non-existent staff: unknown groomer IDs automatically get default availability records (staffApi.ts lines 111-134)
- [ ] [Medium] [A] Reminders route uses wrong permission: uses `canManagePolicies` instead of a dedicated `canManageReminders` permission (App.tsx line 58)
- [ ] [Medium] [A] BookingConfirmPage missing JSON.parse error handling: line 49 parses URL param without try-catch — will crash on malformed URLs
- [ ] [Medium] [A] Complex booking state stored in URL params: JSON-serialized objects in query strings risk URL length limits and encoding errors
- [ ] [Medium] [A] Modal/Drawer missing focus trap: Modal has basic ESC handler but Drawer lacks proper focus trapping and focus-return on close
- [ ] [Medium] [A] Loading skeletons partially wired: Skeleton.tsx created and used in ClientsPage and PetsPage, but ServicesPage, StaffPage, PoliciesPage, RemindersPage still show plain "Loading..." text
- [ ] [Medium] [A] Empty states partially wired: EmptyState.tsx created and used in ClientsPage, PetsPage, ReportsPage — but CalendarPage, ServicesPage, StaffPage lack empty state handling
- [ ] [Medium] [A] Calendar no empty state message: blank grid shown when no appointments exist in view (CalendarPage.tsx)
- [ ] [Medium] [A] Search debouncing partially wired: debounce.ts created and used in ClientsPage and PetsPage, but not in other search contexts
- [ ] [Medium] [A] ID generation weak: timestamp + Math.random() could collide in same millisecond (localStorage.ts lines 43-44)
- [ ] [Medium] [A] Default payment method not enforced as single: multiple methods can be isDefault:true simultaneously (paymentMethodsApi.ts)
- [ ] [Medium] [A] Timezone handling incomplete: organization has timezone field but all date operations use browser local time (calendarApi.ts, staffApi.ts)
- [ ] [Medium] [A] Hardcoded organization slug: DashboardPage.tsx line 327 links to `/book/paws-claws/start` instead of dynamically using organization.slug
- [ ] [Medium] [A] Silent localStorage write failure: localStorage.ts line 20 catch block only logs error — if quota exceeded, user is not informed of data loss
- [ ] [Medium] [A] Duplicate form submissions vulnerable: no debounce or idempotency on mutations — double-clicking create buttons produces duplicate records
- [ ] [Medium] [A] Overly broad query invalidation: mutations invalidate all queries of a type (e.g., all `['appointments']`) instead of specific affected queries — causes unnecessary refetches
- [ ] [Medium] [A] Booking race condition with pet creation: bookingApi.ts line 184 creates pets during booking — if booking fails after pet creation, pet exists in system but appointment doesn't (no transaction support)
- [ ] [Medium] [A] StaffPage schedule table not responsive: min-w-[700px] requires horizontal scroll, no responsive stacking for mobile
- [ ] [Medium] [A] Form labels not always associated: GroomerForm and RemindersPage have `<label>` elements without `htmlFor` attributes, breaking screen reader association
- [ ] [Medium] [A] PoliciesPage number inputs accept invalid values: `maxPetsPerAppointment`, `minAdvanceBookingHours` accept negatives; `depositPercentage` has no max (can exceed 100%)
- [ ] [Medium] [A] BookingTimesPage no loading state: `useAvailableSlotsForWeek` fetches without any loading indicator — time slots appear empty while loading
- [ ] [Medium] [A] No unsaved changes warning: leaving forms with edits (client detail, policies, services) triggers no confirmation prompt — data silently lost
- [ ] [Medium] [A] Overly broad type in vaccinationRemindersApi: line 83 uses `Record<string, unknown>` instead of specific Pet row type, reducing type safety
- [ ] [Medium] [A] **NEW** No maximum appointment count per groomer per day: `maxAppointmentsPerDay` from StaffAvailability is read but never compared against actual daily count (calendarApi.ts)
- [ ] [Medium] [A] **NEW** Type casts without runtime validation: supabase-mappers.ts uses `as` assertions (8+ instances) without runtime checks — invalid DB enum values crash the app
- [ ] [Medium] [A] **NEW** No late cancellation fee calculation: BookingPolicies has `lateCancellationFeePercentage` and `validateCancellationWindow()` returns `isLate`, but fee is never calculated or charged
- [ ] [Medium] [A] **NEW** Deposit payment amount not verified: bookingApi checks payment status is 'completed' but not that `payment.amount >= depositRequired` — status could be faked
- [ ] [Medium] [A] **NEW** Query key inconsistency in React Query: some hooks include `organizationId` in keys, some don't — causes cache pollution when switching orgs
- [ ] [Medium] [A] **NEW** No network error recovery UI: no offline indicator or global retry mechanism visible to users when connection is lost
- [ ] [Medium] [A] **NEW** Color contrast issues with pastel backgrounds: light gray text (`#64748b`) on pastel cards (mint, lemon) may fail WCAG AA 4.5:1 ratio
- [ ] [Medium] [A] **NEW** Modal max-height cuts off on mobile with keyboard: `max-h-[90vh]` too tall when virtual keyboard is open on small phones
- [ ] [Medium] [A] **NEW** CalendarPage mutation flow wrong: `handleCreateAppointment` closes modal immediately after `mutateAsync` without try/catch — modal closes even on failure
- [ ] [Medium] [A] **NEW** Missing null safety on optional fields: `daySchedule.breakStart`, `booking.payment.paymentStatus` accessed without optional chaining in multiple API files
- [ ] [Medium] [A] **NEW** Incomplete error context in API error messages: Supabase errors wrapped with generic messages (e.g., `throw new Error(error.message)`) without operation context
- [ ] [Medium] [A] **NEW** Organization missing create/delete operations: orgApi.ts only has getBySlug, getById, update, getCurrent — cannot create new orgs or delete existing via the app
- [ ] [Medium] [A] **NEW** Cascading deletes lack atomic transactions: clientsApi and petsApi cascade deletions in sequential steps without transactions — partial failure leaves inconsistent state
- [ ] [Medium] [A] **NEW** PetForm in ClientDetailPage has no validation: required fields (name, breed) not validated before submission
- [ ] [Medium] [A] **NEW-R2** No empty state for "no appointment slots available" in booking: BookingTimesPage shows generic "No slots" text without explaining why (groomer time-off, past date, fully booked) — user is confused (BookingTimesPage.tsx lines 298-300)
- [ ] [Medium] [A] **NEW-R2** Vaccination reminder type boundary: `daysUntilExpiration === 0` treated as "7_day" warning instead of "expired" — user gets "7-day warning" on expiration day (vaccinationRemindersApi.ts lines 422-430)
- [ ] [Medium] [A] **NEW-R2** Form submission errors don't clear validation state: if form submission fails, previous inline errors remain visible on retry — stale error messages confuse users (multiple forms)
- [ ] [Medium] [A] **NEW-R2** Drawer doesn't work well on landscape mobile: fixed height drawer with `overflow-y-auto` may not fit on landscape iPhone — needs `max-height: 90vh` or bottom-sheet pattern (Drawer.tsx)
- [ ] [Medium] [A] **NEW-R2** Client/Pet card grids need xl/2xl breakpoints: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` has no xl breakpoint — cards may be too large or too squeezed on tablets (ClientsPage.tsx, PetsPage.tsx)
- [ ] [Medium] [A] **NEW-R2** Booking page buttons not full-width on mobile: `flex justify-between` leaves buttons crowded on narrow screens — should stack vertically on mobile (BookingConfirmPage.tsx lines 363-391)
- [ ] [Medium] [A] **NEW-R2** BookingConfirmPage payment failure has no retry: `setPaymentStatus('failed')` shown but no way to retry without page reload — `.catch()` swallows error silently (BookingConfirmPage.tsx line 275)
- [ ] [Medium] [A] **NEW-R3** SettingsPage validation errors return silently: form validation (lines 177-189) returns early without showing any error toast — user clicks Save, nothing happens, no feedback why
- [ ] [Medium] [A] **NEW-R3** RemindersPage no validation before save: `updateReminders.mutateAsync(formData)` sends unvalidated data — negative days, invalid percentages all accepted
- [ ] [Medium] [A] **NEW-R3** PoliciesPage no validation before save: deposit > 100%, negative fees, min/max booking range conflicts all accepted without error
- [ ] [Medium] [A] **NEW-R3** Delete warnings don't mention related data: client deletion dialog doesn't show pet/appointment count, service deletion doesn't check active appointments — user lacks context for informed decision
- [ ] [Medium] [A] **NEW-R3** Stripe webhook billing_events insert not protected: after successful event handling, `billing_events` INSERT (line 104) can fail but function returns 200 anyway — audit trail silently lost, Stripe won't retry (stripe-webhook/index.ts)
- [ ] [Medium] [A] **NEW-R3** Service modifier conditions not validated during booking: modifiers applied without checking pet meets weight/coat/breed condition — wrong price calculated (bookingApi.ts lines 71-84)
- [ ] [Medium] [A] **NEW-R3** Booking policies deposit not range-validated: `depositPercentage` not checked for 0-100 range, `depositMinimum` not checked for >= 0 — negative deposits possible (bookingApi.ts lines 110-113)
- [ ] [Medium] [A] **NEW-R3** No unsaved changes warning on form pages: Settings, Reminders, Policies track `hasChanges` but don't warn on navigation — data silently lost
- [ ] [Medium] [A] **NEW-R3** Save buttons missing disabled state during submission: multiple pages show loading spinner but don't disable button, allowing double-submit (SettingsPage, RemindersPage, PoliciesPage)
- [ ] [Medium] [A] **NEW-R3** Pet deletion leaves orphaned appointments: `petsApi.delete()` removes pet from `appointment_pets` but leaves parent `appointments` row — appointment with 0 pets breaks rendering (petsApi.ts lines 122-150)
- [ ] [Medium] [B] **NEW** Timezone conversion needs date-fns-tz: organization.timezone stored but never used for date conversion — multi-timezone orgs show wrong times

## Low

- [ ] [Low] [A] GroomersPage.tsx is dead code: exported from index.ts but never imported in App.tsx — replaced by StaffPage
- [ ] [Low] [A] Performance API ratings always mocked: calculateAverageRating() returns random 4.5-5.0 regardless of data (performanceApi.ts)
- [ ] [Low] [A] Policies API falls back to seed on org mismatch: should throw error instead of silently returning default (policiesApi.ts lines 16-25)
- [ ] [Low] [A] staffApi time-off seed dates hardcoded to 2024: will always be stale/past (staffApi.ts lines 60-77)
- [ ] [Low] [A] Groomer role mismatch: groomersApi includes owner and receptionist roles in groomer data (groomersApi.ts)
- [ ] [Low] [A] No aria-live regions for dynamic search results (ClientsPage, PetsPage)
- [ ] [Low] [A] Status badges color-only: no text context for colorblind users (Calendar, Dashboard)
- [ ] [Low] [A] No pagination on list pages: all records loaded at once — issue at scale
- [ ] [Low] [A] No sorting options on list pages: search exists but no column sort
- [ ] [Low] [A] Textarea fields have no max-length constraints (notes, descriptions)
- [ ] [Low] [A] Login redirects to /app/calendar instead of /app/dashboard (LoginPage.tsx line 21)
- [ ] [Low] [A] BookingGroomerPage allows continue without selecting groomer: canContinue is always true (line 119) — next step handles "Any Available" but UX is unclear
- [ ] [Low] [A] Negative service prices allowed: no validation prevents negative basePrice or priceAdjustment in servicesApi
- [ ] [Low] [A] Calendar view crowded on mobile: month view with many events, should default to day view on small screens
- [ ] [Low] [A] BookingTimesPage week grid not mobile-friendly: small time slot buttons difficult to tap on mobile
- [ ] [Low] [A] ServicesPage empty state inconsistent: uses plain Card wrapper instead of EmptyState component used elsewhere
- [ ] [Low] [A] PetDetailPage client data race condition: `useClient(pet?.clientId)` executes before pet loads, causing brief loading flicker for client info
- [ ] [Low] [A] **NEW** Feature flags defined but never enforced: `isFeatureEnabled()` function exists but is never called anywhere — subscription gating works but feature flags are dead code (flags.ts)
- [ ] [Low] [A] **NEW** No retry strategy for mock payment processing: mockStripe has 95% success rate but no retry logic in paymentMethodsApi.processPayment()
- [ ] [Low] [A] **NEW** Env vars not validated at startup: VITE_SUPABASE_URL, VITE_STRIPE_PUBLISHABLE_KEY not checked — app fails silently if misconfigured
- [ ] [Low] [A] **NEW** ComboBox/AddressAutocomplete missing keyboard navigation hints: ARIA roles correct but no visual hint about arrow key navigation
- [ ] [Low] [A] **NEW** Dashboard stats cards stack vertically on mobile: `sm:grid-cols-2 lg:grid-cols-4` means single column below 640px — `grid-cols-2` would be better
- [ ] [Low] [A] **NEW** Missing aria-labels on icon-only edit buttons: ClientDetailPage, PetDetailPage have ghost buttons with only icon and no aria-label
- [ ] [Low] [A] **NEW** New pets bypass vaccination checks during booking: existing pets checked for expired vaccinations but new pets created without any vaccination validation (bookingApi.ts lines 192-209)
- [ ] [Low] [A] **NEW-R2** Time-off date range boundary semantics ambiguous: `endDate` treated as inclusive (setHours 23:59:59) but typical semantics are exclusive — document or standardize (calendarApi.ts lines 287-296)
- [ ] [Low] [A] **NEW-R2** Sidebar routes array references deprecated `/app/groomers` path: keyboard navigation (Shift+Up/Down) hits redirect before landing on `/app/staff` — should use `/app/staff` directly (AppLayout.tsx line 35)
- [ ] [Low] [A] **NEW-R2** Confirm dialog has no delay before enabling confirm button: user can accidentally double-click and confirm destructive action immediately (ConfirmDialog.tsx)
- [ ] [Low] [A] **NEW-R2** Dropdown options lack visible focus state: keyboard navigation in Select/ComboBox components doesn't clearly highlight focused option (Select.tsx, ComboBox.tsx)
- [ ] [Low] [A] **NEW-R3** StaffPage search has no debounce: unlike ClientsPage/PetsPage which use debounce, StaffPage filters on every keystroke — causes lag on large staff lists
- [ ] [Low] [A] **NEW-R3** Theme picker not grouped by category: all 21 themes shown in flat grid with no Pastel/Vibrant/Dark grouping — overwhelming for users (SettingsPage.tsx lines 383-450)
- [ ] [Low] [A] **NEW-R3** ReportsPage subscription gate uses silent mode: export buttons disappear without explanation on Solo plan — should show upgrade prompt instead (ReportsPage.tsx lines 346-364)
- [ ] [Low] [A] **NEW-R3** SettingsPage theme buttons missing aria-labels: screen reader users can't identify theme options (SettingsPage.tsx lines 398-440)
- [ ] [Low] [A] **NEW-R3** Subscription cache 30s stale time after upgrade: after upgrading in Stripe portal, features don't appear for up to 30 seconds — confusing UX (useBilling.ts line 11)
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

## Bucket B (Requires External APIs) - Summary

- [ ] [High] [B] Stripe integration is fully mocked: mockStripe.ts simulates payments — no real payment processing for bookings
- [ ] [High] [B] Email notifications are mocked: needs Resend integration for all notification types (email-first strategy; SMS deferred)
- [ ] [High] [B] **NEW** RLS policies allow anonymous client creation: needs rate limiting, CAPTCHA, or tighter scoping
- [x] [RESOLVED] [Medium] [B] Supabase client is a stub: fully migrated — all 14 API modules now use Supabase queries, RLS policies active
- [x] [RESOLVED] [Medium] [B] No real authentication: Supabase Auth integrated with Google OAuth (PKCE flow), real signInWithPassword/signInWithOAuth
- [ ] [Medium] [B] Timezone conversion needs date-fns-tz: organization.timezone stored but never used for date conversion
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

## High Priority Bucket A - Summary

- [ ] [High] [A] **NEW-R2** DashboardPage "Today's Schedule" has no loading state (DashboardPage.tsx lines 238-294)
- [ ] [High] [A] **NEW-R2** BookingStartPage missing firstName/lastName inline validation (BookingStartPage.tsx lines 64-74)
- [ ] [High] [A] **NEW-R2** No skip-to-main-content link — WCAG 2.4.1 failure (AppLayout.tsx)
- [ ] [High] [A] **NEW-R2** Groomer ID not validated before appointment creation (calendarApi.ts lines 152-197)
- [ ] [High] [A] **NEW-R2** Phone validation regex too permissive (BookingStartPage.tsx line 62)
- [ ] [High] [A] **NEW-R2** Required form fields not visually marked (all forms)
- [ ] [High] [A] **NEW-R3** ConfirmDialog silently swallows errors (ConfirmDialog.tsx lines 42-51)
- [ ] [High] [A] **NEW-R3** BookingStartPage setState in render anti-pattern (BookingStartPage.tsx lines 31-34)
- [ ] [High] [A] **NEW-R3** CalendarPage email send failure silent (CalendarPage.tsx)
- [ ] [High] [A] **NEW-R3** StaffPage no confirmation dialog for deletion (StaffPage.tsx)
- [ ] [High] [A] **NEW-R3** ReportsPage CSV/PDF export failure silent (ReportsPage.tsx lines 307-331)
- [ ] [High] [A] **NEW-R3** Groomer break time validation fails for inverted times (calendarApi.ts lines 344-352)

---

## Summary

| Severity | Bucket A (Open) | Bucket A (Resolved) | Bucket B (Open) | Bucket B (Resolved) | Total Open |
|----------|-----------------|---------------------|-----------------|---------------------|------------|
| Critical | 5 (+1)          | 7                   | 0               | 0                   | 5          |
| High     | 18 (+6)         | 19                  | 3               | 0                   | 21         |
| Medium   | 56 (+10)        | 1                   | 1               | 2                   | 57         |
| Low      | 33 (+5)         | 0                   | 1               | 0                   | 34         |
| **Total**| **112**         | **27**              | **5**           | **2**               | **117**    |

*+22 new issues found in run #3 (2026-02-15). No issues resolved since run #2.*
