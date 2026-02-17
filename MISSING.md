# MISSING.md - App Completeness Audit

Last audited: 2026-02-15 (re-audited, run #4)

---

## Critical

- [x] [RESOLVED] [Critical] [A] Seed data ID mismatch: seedUsers uses `user-1/2/3`, seedGroomers uses `groomer-1/2/3/4` — fixed in groomersApi.ts, all IDs now consistent
- [x] [RESOLVED] [Critical] [A] Duplicate groomer seed data: groomersApi.ts had conflicting seedGroomers — removed, seed.ts is now single source of truth
- [x] [RESOLVED] [Critical] [A] Staff availability ID mismatch: staffApi.ts referenced wrong IDs — updated to match seed.ts user IDs
- [x] [RESOLVED] [Critical] [A] No error handling on mutations: ToastContext created, global error handler wired in queryClient.ts, all hook files updated
- [x] [RESOLVED] [Critical] [A] Empty catch blocks: CalendarPage.tsx lines 259 and 301 had `catch { /* Error handled by react-query */ }` which swallowed errors silently — removed try/catch wrappers so errors propagate to React Query's global MutationCache onError handler
- [x] [RESOLVED] [Critical] [A] No global error handling: queryClient.ts now has MutationCache with onError callback wired to ToastContext
- [x] [RESOLVED] [Critical] [A] Undefined variable `user` in ClientDetailPage PetForm: useCurrentUser hook was already imported and called — `user` is in scope, bug was previously fixed
- [x] [RESOLVED] [Critical] [A] Race condition in appointment slot booking: conflict re-check added at insert time in calendarApi.create() + checkForConflicts() helper
- [x] [RESOLVED] [Critical] [A] Double-click booking race condition: isSubmitting state added to disable Pay button during submission in BookingConfirmPage
- [x] [RESOLVED] [Critical] [A] Booking intake allows 0 services per pet: validation already existed in handlePayment, confirmed working
- [x] [RESOLVED] [Critical] [A] No empty state for "no services available" in booking intake: empty state already existed with "Change Groomer" button, confirmed working
- [x] [RESOLVED] [Critical] [A] Subscription dev bypass blocked in production: changed to `import.meta.env.DEV && ...` so bypass only works in dev mode
- [x] [RESOLVED] [Critical] [A] Missing FK constraints on 5 tables: migration 009_add_foreign_keys.sql converts TEXT→UUID and adds FK constraints with CASCADE/SET NULL

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
- [x] [RESOLVED] [High] [A] No query error states displayed: isError/error/refetch added to ClientsPage, PetsPage, StaffPage, ServicesPage, CalendarPage, DashboardPage, RemindersPage, SettingsPage, ReportsPage
- [x] [RESOLVED] [High] [A] Payment status not validated before completing appointment: updateStatus() now checks payment_status before allowing 'completed' transition
- [x] [RESOLVED] [High] [A] No conflict detection when updating/dragging appointments: update() now calls checkForConflicts() when time/groomer changes
- [x] [RESOLVED] [High] [A] Service modifier deletion invalidates existing appointments: removeModifier() now queries appointment_services for references before deleting
- [x] [RESOLVED] [High] [A] CalendarPage has no loading state: loading spinner shown while any data source is loading
- [x] [RESOLVED] [High] [A] ReportsPage has no loading state: LoadingSpinner shown while data loads, prevents charts from rendering with undefined data
- [x] [RESOLVED] [High] [A] ConfirmDialog silently swallows errors: already had showError toast and keeps dialog open on error, confirmed working
- [x] [RESOLVED] [High] [A] BookingStartPage setState in render anti-pattern: useEffect dependency array fixed with selectedClient?.id
- [x] [RESOLVED] [High] [A] CalendarPage email send failure silent: error toast added when email send fails
- [x] [RESOLVED] [High] [A] StaffPage no confirmation dialog for deletion: ConfirmDialog added with deleteConfirmId state
- [x] [RESOLVED] [High] [A] ReportsPage CSV/PDF export failure silent: already had try-catch with toast, confirmed working
- [x] [RESOLVED] [High] [A] Groomer break time validation fails for inverted times: guard added to skip break check when breakStart >= breakEnd
- [ ] [High] [B] Stripe integration is fully mocked: mockStripe.ts simulates payments — no real payment processing for bookings
- [ ] [High] [B] Email notifications are mocked: mockEmailService.ts logs to console/localStorage only — needs Resend integration for all notification types (confirmations, reminders, cancellations, vaccination alerts). Email-first strategy; SMS deferred to future phase.
- [x] [RESOLVED] [High] [A] ServiceForm missing validation: validation added requiring non-empty name, positive duration, non-negative price
- [ ] [High] [B] **NEW** RLS policies allow anonymous client creation: anonymous users can create clients and view client data (for booking flow) — abusable for data scraping or spamming (supabase/migrations/002_rls_policies.sql lines 77-82)
- [ ] [High] [B] **NEW-R4** RLS policies for staff_availability and time_off_requests use `USING(true)` for SELECT — exposes all orgs' staff schedule data globally (002_rls_policies.sql lines 314, 330)

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
- [ ] [Medium] [A] **NEW-R4** Appointment creation in ClientDetailPage doesn't navigate to calendar after success — modal closes silently, user doesn't know appointment was created (ClientDetailPage.tsx lines 232-257)
- [ ] [Medium] [A] **NEW-R4** No client link from appointment details drawers — must manually navigate to Clients page to find client (AppointmentDetailsDrawer)
- [ ] [Medium] [A] **NEW-R4** Booking state not persisted to localStorage — page refresh during booking flow loses all progress with no warning
- [ ] [Medium] [A] **NEW-R4** Permission denied redirect shows no explanation — ProtectedRoute redirects to dashboard without error toast (ProtectedRoute.tsx)
- [ ] [Medium] [A] **NEW-R4** Service modifier price stacking unbounded — multiple modifiers can inflate price without any cap or warning (bookingApi.ts)
- [ ] [Medium] [A] **NEW-R4** Floating point precision loss in price calculations — `basePrice * priceAdjustment / 100` accumulates rounding errors (bookingApi.ts line 80)
- [ ] [Medium] [A] **NEW-R4** Time-off date parsing not validated — `parseISO()` on malformed DB dates returns Invalid Date, silently breaking availability checks (calendarApi.ts lines 304-307)
- [ ] [Medium] [A] **NEW-R4** Inconsistent overlap logic between conflict detection and buffer checking — buffer applies `-bufferMinutes` to start but conflict check doesn't, causing edge-case double-bookings (calendarApi.ts lines 331-366)
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
- [ ] [Low] [A] **NEW-R4** Landing page visible to authenticated users — `/` shows LandingPage instead of redirecting to `/app/dashboard` (App.tsx)
- [ ] [Low] [A] **NEW-R4** Mobile sidebar collapse state not persisted across sessions (Sidebar.tsx)
- [ ] [Low] [A] **NEW-R4** PetDetailPage back button always goes to `/app/pets` instead of previous client page — extra click needed (PetDetailPage.tsx line 32)
- [ ] [Low] [A] **NEW-R4** Dashboard calendar links lack groomer/date filter context — user must manually filter after navigation (DashboardPage.tsx)
- [ ] [Low] [A] **NEW-R4** Settings link only in sidebar footer — less discoverable than main nav items (Sidebar.tsx)
- [ ] [Low] [A] **NEW-R4** Inconsistent error throwing: some APIs throw BookingValidationError, others throw generic Error — inconsistent caller error handling
- [ ] [Low] [A] **NEW-R4** servicesApi.getById() doesn't validate service belongs to calling user's org — slight timing side-channel
- [ ] [Low] [A] **NEW-R4** Seed script doesn't validate auth user creation success — missing email-to-ID mapping causes downstream seed failures (seed-supabase.ts lines 123-135)
- [ ] [Low] [A] **NEW-R4** Policy config allows nonsensical values: `minAdvanceBookingHours` can exceed `maxAdvanceBookingDays * 24` making booking impossible (validators.ts)
- [ ] [Low] [A] **NEW-R4** Deposit calculation doesn't cap at totalPrice — `depositRequired` could exceed total cost (bookingApi.ts line 112)
- [ ] [Low] [A] **NEW-R4** useGroomers vs useStaff dual hook system — both call staffApi, causes maintenance confusion about which to use
- [ ] [Low] [A] **NEW-R4** Groomer email uniqueness not enforced in DB schema — duplicate emails possible per org (001_initial_schema.sql groomers table)
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

## Bucket B (Requires External APIs) - Summary

- [ ] [High] [B] Stripe integration is fully mocked: mockStripe.ts simulates payments — no real payment processing for bookings
- [ ] [High] [B] Email notifications are mocked: needs Resend integration for all notification types (email-first strategy; SMS deferred)
- [ ] [High] [B] **NEW** RLS policies allow anonymous client creation: needs rate limiting, CAPTCHA, or tighter scoping
- [ ] [High] [B] **NEW-R4** RLS policies for staff_availability and time_off_requests use `USING(true)` — exposes all orgs' data globally
- [x] [RESOLVED] [Medium] [B] Supabase client is a stub: fully migrated — all 14 API modules now use Supabase queries, RLS policies active
- [x] [RESOLVED] [Medium] [B] No real authentication: Supabase Auth integrated with Google OAuth (PKCE flow), real signInWithPassword/signInWithOAuth
- [ ] [Medium] [B] Timezone conversion needs date-fns-tz: organization.timezone stored but never used for date conversion
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

## High Priority Bucket A - Summary

- [x] [RESOLVED] [High] [A] DashboardPage "Today's Schedule" has no loading state — skeleton cards added while loading
- [x] [RESOLVED] [High] [A] BookingStartPage missing firstName/lastName inline validation — onBlur validation added
- [x] [RESOLVED] [High] [A] No skip-to-main-content link — already existed in AppLayout.tsx, confirmed working
- [x] [RESOLVED] [High] [A] Groomer ID not validated before appointment creation — groomer existence/active check added in calendarApi.create()
- [x] [RESOLVED] [High] [A] Phone validation regex too permissive — tightened to require 10+ chars
- [x] [RESOLVED] [High] [A] Required form fields not visually marked — red asterisk added to Input (already had), Select, and Textarea components
- [x] [RESOLVED] [High] [A] ConfirmDialog silently swallows errors — already had showError toast, confirmed working
- [x] [RESOLVED] [High] [A] BookingStartPage setState in render anti-pattern — useEffect dependency fixed
- [x] [RESOLVED] [High] [A] CalendarPage email send failure silent — error toast added
- [x] [RESOLVED] [High] [A] StaffPage no confirmation dialog for deletion — ConfirmDialog added
- [x] [RESOLVED] [High] [A] ReportsPage CSV/PDF export failure silent — already had try-catch with toast, confirmed working
- [x] [RESOLVED] [High] [A] Groomer break time validation fails for inverted times — guard added for breakStart >= breakEnd
- [x] [RESOLVED] [High] [A] ServiceForm missing validation — name, duration, price validation added

---

## Summary

| Severity | Bucket A (Open) | Bucket A (Resolved) | Bucket B (Open) | Bucket B (Resolved) | Total Open |
|----------|-----------------|---------------------|-----------------|---------------------|------------|
| Critical | 0               | 13                  | 0               | 0                   | 0          |
| High     | 0               | 38                  | 4               | 0                   | 4          |
| Medium   | 64              | 1                   | 1               | 2                   | 65         |
| Low      | 45              | 0                   | 1               | 0                   | 46         |
| **Total**| **109**         | **52**              | **6**           | **2**               | **115**    |

*Run #4 fix pass (2026-02-15): 25 Critical/High Bucket A issues resolved. 0 Critical and 0 High Bucket A items remain open.*
