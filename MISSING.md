# MISSING.md - App Completeness Audit

Last audited: 2026-02-12

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
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

## Bucket B (Requires External APIs) - Summary

- [ ] [High] [B] Stripe integration is fully mocked: mockStripe.ts simulates payments — no real payment processing for bookings
- [ ] [High] [B] Email notifications are mocked: needs Resend integration for all notification types (email-first strategy; SMS deferred)
- [ ] [High] [B] **NEW** RLS policies allow anonymous client creation: needs rate limiting, CAPTCHA, or tighter scoping
- [x] [RESOLVED] [Medium] [B] Supabase client is a stub: fully migrated — all 14 API modules now use Supabase queries, RLS policies active
- [x] [RESOLVED] [Medium] [B] No real authentication: Supabase Auth integrated with Google OAuth (PKCE flow), real signInWithPassword/signInWithOAuth
- [ ] [Medium] [B] Timezone conversion needs date-fns-tz: organization.timezone stored but never used for date conversion
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

---

## Summary

| Severity | Bucket A (Open) | Bucket A (Resolved) | Bucket B (Open) | Bucket B (Resolved) | Total Open |
|----------|-----------------|---------------------|-----------------|---------------------|------------|
| Critical | 1               | 7                   | 0               | 0                   | 1          |
| High     | 6               | 19                  | 3               | 0                   | 9          |
| Medium   | 39              | 1                   | 1               | 2                   | 40         |
| Low      | 24              | 0                   | 1               | 0                   | 25         |
| **Total**| **70**          | **27**              | **5**           | **2**               | **75**     |
