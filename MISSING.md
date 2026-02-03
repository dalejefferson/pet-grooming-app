# MISSING.md - App Completeness Audit

Last audited: 2026-02-02

---

## Critical

- [x] [RESOLVED] [Critical] [A] Seed data ID mismatch: seedUsers uses `user-1/2/3`, seedGroomers uses `groomer-1/2/3/4` — fixed in groomersApi.ts, all IDs now consistent
- [x] [RESOLVED] [Critical] [A] Duplicate groomer seed data: groomersApi.ts had conflicting seedGroomers — removed, seed.ts is now single source of truth
- [x] [RESOLVED] [Critical] [A] Staff availability ID mismatch: staffApi.ts referenced wrong IDs — updated to match seed.ts user IDs
- [x] [RESOLVED] [Critical] [A] No error handling on mutations: ToastContext created, global error handler wired in queryClient.ts, all hook files updated
- [ ] [Critical] [A] Empty catch blocks: CalendarPage.tsx lines 249 and 286 have `catch { /* Error handled by react-query */ }` which swallows errors silently — toast system exists but these catch blocks prevent it from firing
- [x] [RESOLVED] [Critical] [A] No global error handling: queryClient.ts now has MutationCache with onError callback wired to ToastContext

## High

- [x] [RESOLVED] [High] [A] No appointment conflict detection: calendarApi.getAvailableSlots() now checks overlapping appointments (lines 205-214)
- [x] [RESOLVED] [High] [A] Invalid status transitions: statusMachine.ts created with valid transition map, calendarApi.updateStatus() validates via validateStatusTransition()
- [x] [RESOLVED] [High] [A] Buffer time between appointments not enforced: calendarApi.getAvailableSlots() now implements buffer time checks (lines 229-247)
- [x] [RESOLVED] [High] [A] maxPetsPerAppointment policy not enforced: validators.ts created, bookingApi.createBooking() calls validateMaxPetsPerAppointment()
- [ ] [High] [A] Cancellation window policy not enforced: validateCancellationWindow() exists in validators.ts but is never called in calendarApi.updateStatus() cancellation flow
- [ ] [High] [A] newClientMode 'blocked' not enforced: bookingApi line 195 only handles 'auto_confirm' — if policy is 'blocked', new clients can still book
- [ ] [High] [A] Vaccination expiration not checked on booking: validateVaccinationStatus() exists in validators.ts but is never called in bookingApi.createBooking()
- [ ] [High] [A] Expired payment cards can process: processPayment() doesn't validate card expiration (paymentMethodsApi.ts lines 177-196)
- [ ] [High] [A] Missing deposit validation: no check that deposit meets policies.depositMinimum (bookingApi.ts lines 200-201)
- [ ] [High] [A] Service modifier silently skipped: if modifier deleted after selection, price/duration calculated wrong (bookingApi.ts lines 65-76)
- [ ] [High] [A] BookingContext partially unused: booking pages still use URL params for some state — state is fragile and scattered across context + URL
- [ ] [High] [A] No form validation with inline errors: forms use HTML `required` only, no email/phone format validation, no inline error messages despite Input supporting `error` prop
- [x] [RESOLVED] [High] [A] No confirmation dialogs for destructive actions: ConfirmDialog.tsx created, wired into ClientsPage, PetsPage, ServicesPage
- [x] [RESOLVED] [High] [A] No success/error toast notifications for mutations: ToastContext created and wired into useCalendar, useClients, usePets, useServices, useStaff, useGroomers hooks
- [ ] [High] [A] Calendar accessibility gaps: no ARIA labels for calendar slots, react-big-calendar may have screen reader issues (CalendarPage.tsx)
- [ ] [High] [A] No cascading deletes: deleting a client orphans their pets and appointments; deleting a pet leaves invalid appointment references; deleting a groomer leaves unassigned appointments (clientsApi.ts, petsApi.ts, groomersApi.ts)
- [ ] [High] [A] Empty petId fallback in bookingApi: line 217 uses empty string `''` when petId is missing instead of throwing error — creates appointments with broken pet references

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

## Bucket B (Requires External APIs)

- [ ] [High] [B] Stripe integration is fully mocked: mockStripe.ts simulates payments — no real payment processing
- [ ] [High] [B] Email/SMS services are mocked: notification services in modules/notifications/services/ are stubs
- [ ] [Medium] [B] Supabase client is a stub: no real database, auth, or real-time subscriptions
- [ ] [Medium] [B] No real authentication: login is simulated against seed users in localStorage
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

---

## Summary

| Severity | Bucket A (Open) | Bucket A (Resolved) | Bucket B | Total Open |
|----------|-----------------|---------------------|----------|------------|
| Critical | 1               | 5                   | 0        | 1          |
| High     | 9               | 6                   | 2        | 11         |
| Medium   | 21              | 1                   | 2        | 23         |
| Low      | 15              | 0                   | 1        | 16         |
| **Total**| **46**          | **12**              | **5**    | **51**     |
