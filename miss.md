# App Completeness Audit - Sit Pretty Club

**Date:** 2026-02-12 (Run #2)
**Audited by:** 3 parallel agents (Navigation & Data Flows, UX Completeness, Data Integrity & Logic)

---

## Audit Results at a Glance

| Severity | Bucket A (Local Fix) | Bucket B (External API) | Total Open |
|----------|---------------------|------------------------|------------|
| Critical | 4                   | 0                      | **4**      |
| High     | 12                  | 3                      | **15**     |
| Medium   | 46                  | 1                      | **47**     |
| Low      | 28                  | 1                      | **29**     |
| **Total**| **90**              | **5**                  | **95**     |
| Resolved | 27                  | 2                      | **29**     |

---

## New Issues Found This Run (20 items)

### Critical (3 new)

| # | Issue | File | Bucket |
|---|-------|------|--------|
| 1 | **Double-click booking race condition** — no idempotency guard on "Confirm Booking" button; user can spam-click during the 2s payment simulation and create duplicate appointments | BookingConfirmPage.tsx:173-230 | A |
| 2 | **Booking allows 0 services per pet** — no validation that at least 1 service is selected per pet before proceeding to payment; user can complete entire flow with empty services | BookingConfirmPage.tsx | A |
| 3 | **Blank screen when no services match groomer** — booking intake shows nothing useful when the selected groomer has no compatible services; `hasAvailableServices` guards redirect but no user-facing message | BookingIntakePage.tsx:99 | A |

### High (6 new)

| # | Issue | File | Bucket |
|---|-------|------|--------|
| 4 | **DashboardPage "Today's Schedule" no loading state** — appointment list loads async with no skeleton or spinner; content pops in | DashboardPage.tsx:238-294 | A |
| 5 | **BookingStartPage missing name field validation** — only email/phone show inline errors; firstName/lastName required fields show no error messages; guard prevents submit but user doesn't know why | BookingStartPage.tsx:64-74 | A |
| 6 | **No skip-to-main-content link** — keyboard users must tab through entire sidebar before reaching main content; WCAG 2.4.1 failure | AppLayout.tsx | A |
| 7 | **Groomer ID not validated before appointment creation** — `calendarApi.create()` inserts `groomer_id` without checking groomer exists or is active; can assign to deleted/inactive staff | calendarApi.ts:152-197 | A |
| 8 | **Phone validation regex too permissive** — `/^[+]?[\d\s()-]{7,}$/` accepts invalid formats like "1 2 3 4 5 6 7"; needs stricter pattern or libphonenumber-js | BookingStartPage.tsx:62 | A |
| 9 | **Required fields not visually marked** — Input components have HTML `required` attribute but no asterisk or visual indicator for sighted users | All forms | A |

### Medium (7 new)

| # | Issue | File | Bucket |
|---|-------|------|--------|
| 10 | **"No slots" message gives no explanation** — BookingTimesPage shows generic text without context (groomer time-off? past date? fully booked?) | BookingTimesPage.tsx:298-300 | A |
| 11 | **Vaccination reminder boundary edge case** — `daysUntilExpiration === 0` treated as "7_day" warning instead of "expired"; user gets "7-day warning" on expiration day | vaccinationRemindersApi.ts:422-430 | A |
| 12 | **Form errors don't clear on retry** — if submission fails, previous inline errors remain visible when user retries; stale messages confuse users | Multiple forms | A |
| 13 | **Drawer broken on landscape mobile** — fixed height drawer with `overflow-y-auto` may not fit on landscape iPhone; needs `max-height: 90vh` or bottom-sheet pattern | Drawer.tsx | A |
| 14 | **Card grids missing xl/2xl breakpoints** — `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` has no xl breakpoint; cards too large or too squeezed on tablets | ClientsPage.tsx, PetsPage.tsx | A |
| 15 | **Booking buttons not full-width on mobile** — `flex justify-between` leaves buttons crowded on narrow screens; should stack vertically | BookingConfirmPage.tsx:363-391 | A |
| 16 | **Payment failure has no retry** — `setPaymentStatus('failed')` shown but no way to retry without page reload; `.catch()` swallows error silently | BookingConfirmPage.tsx:275 | A |

### Low (4 new)

| # | Issue | File | Bucket |
|---|-------|------|--------|
| 17 | **Time-off date boundary semantics ambiguous** — `endDate` treated as inclusive (setHours 23:59:59) but typical semantics are exclusive; should document or standardize | calendarApi.ts:287-296 | A |
| 18 | **Sidebar routes array references deprecated path** — keyboard nav (Shift+Up/Down) hits `/app/groomers` redirect before landing on `/app/staff` | AppLayout.tsx:35 | A |
| 19 | **Confirm dialog has no delay before enabling button** — user can accidentally double-click and confirm destructive action immediately | ConfirmDialog.tsx | A |
| 20 | **Dropdown options lack visible focus state** — keyboard navigation in Select/ComboBox doesn't clearly highlight focused option | Select.tsx, ComboBox.tsx | A |

---

## Existing Issues Still Open (75 items)

### Critical (1)

- [ ] Race condition in appointment slot booking — two users can book the same slot simultaneously; no DB-level constraint or transaction lock (calendarApi.ts)

### High (9)

- [ ] No query error states displayed — failed fetches show empty/loading state indefinitely (all pages)
- [ ] Payment status not validated before completing appointment (calendarApi.ts)
- [ ] No conflict detection when dragging/updating appointments (calendarApi.ts)
- [ ] Service modifier deletion invalidates existing appointments (servicesApi.ts)
- [ ] CalendarPage has no loading state — flash of empty calendar (CalendarPage.tsx)
- [ ] ReportsPage has no loading state — charts render with incomplete data (ReportsPage.tsx)
- [ ] Stripe integration fully mocked — no real payment processing [Bucket B]
- [ ] Email notifications mocked — needs Resend integration for all types [Bucket B]
- [ ] RLS policies allow anonymous client creation — abusable for spam [Bucket B]

### Medium (38)

- [ ] Soft delete restore creates new ID, orphaning references (historyApi.ts)
- [ ] No input validation in APIs — empty strings, negatives, invalid emails accepted
- [ ] Time slot duration mismatch in `getAvailableSlots()` (calendarApi.ts)
- [ ] No optimistic locking — concurrent edits cause lost updates
- [ ] Groomer availability auto-creates for non-existent staff (staffApi.ts)
- [ ] Reminders route uses wrong permission `canManagePolicies` (App.tsx)
- [ ] BookingConfirmPage missing JSON.parse error handling (line 49)
- [ ] Complex booking state in URL params risks length limits
- [ ] Modal/Drawer missing focus trap (Modal.tsx, Drawer.tsx)
- [ ] Loading skeletons partially wired — ServicesPage, StaffPage, PoliciesPage, RemindersPage still plain text
- [ ] Empty states partially wired — CalendarPage, ServicesPage, StaffPage lack handling
- [ ] Calendar no empty state message for zero appointments
- [ ] Search debouncing only in ClientsPage and PetsPage
- [ ] ID generation weak — timestamp + Math.random() collision risk
- [ ] Multiple payment methods can be `isDefault:true` simultaneously
- [ ] Timezone handling incomplete — all dates use browser local time
- [ ] Hardcoded org slug `/book/paws-claws/start` in DashboardPage
- [ ] Silent localStorage write failure on quota exceeded
- [ ] Duplicate form submissions — no debounce on mutations
- [ ] Overly broad query invalidation causes unnecessary refetches
- [ ] Booking race condition with pet creation — pet created but booking fails
- [ ] StaffPage schedule table not responsive on mobile
- [ ] Form labels not always associated (GroomerForm, RemindersPage)
- [ ] PoliciesPage number inputs accept negatives/over 100%
- [ ] BookingTimesPage no loading state for slot fetch
- [ ] No unsaved changes warning when leaving forms
- [ ] Overly broad type in vaccinationRemindersApi (Record<string, unknown>)
- [ ] No max appointment count per groomer per day enforced
- [ ] Type casts without runtime validation in supabase-mappers.ts
- [ ] No late cancellation fee calculation despite having the field
- [ ] Deposit payment amount not verified — status could be faked
- [ ] Query key inconsistency causes cache pollution across orgs
- [ ] No network error recovery UI / offline indicator
- [ ] Color contrast issues with light text on pastel cards
- [ ] Modal max-height cuts off on mobile with virtual keyboard
- [ ] CalendarPage mutation flow closes modal even on failure
- [ ] Missing null safety on optional fields in API files
- [ ] Incomplete error context in API error messages
- [ ] Organization missing create/delete operations (orgApi.ts)
- [ ] Cascading deletes lack atomic transactions
- [ ] PetForm in ClientDetailPage has no validation
- [ ] Timezone conversion needs date-fns-tz [Bucket B]

### Low (25)

- [ ] GroomersPage.tsx is dead code — never imported
- [ ] Performance API ratings always mocked (random 4.5-5.0)
- [ ] Policies API falls back to seed on org mismatch silently
- [ ] staffApi time-off seed dates hardcoded to 2024
- [ ] Groomer role mismatch in groomersApi
- [ ] No aria-live regions for dynamic search results
- [ ] Status badges color-only — no text for colorblind users
- [ ] No pagination on list pages
- [ ] No sorting options on list pages
- [ ] Textarea fields have no max-length constraints
- [ ] Login redirects to /app/calendar instead of /app/dashboard
- [ ] BookingGroomerPage allows continue without selecting groomer
- [ ] Negative service prices allowed
- [ ] Calendar view crowded on mobile — should default to day view
- [ ] BookingTimesPage week grid not mobile-friendly
- [ ] ServicesPage empty state inconsistent with other pages
- [ ] PetDetailPage client data race condition on load
- [ ] Feature flags defined but never enforced
- [ ] No retry strategy for mock payment processing
- [ ] Env vars not validated at startup
- [ ] ComboBox/AddressAutocomplete missing keyboard nav hints
- [ ] Dashboard stats cards stack to single column below 640px
- [ ] Missing aria-labels on icon-only edit buttons
- [ ] New pets bypass vaccination checks during booking
- [ ] Feature flags hardcoded as static booleans [Bucket B]

---

## Resolved Issues (29)

- [x] Seed data ID mismatch (user vs groomer IDs)
- [x] Duplicate groomer seed data
- [x] Staff availability ID mismatch
- [x] No error handling on mutations (global MutationCache onError added)
- [x] Empty catch blocks in CalendarPage
- [x] No global error handling (queryClient.ts MutationCache)
- [x] Undefined variable `user` in ClientDetailPage PetForm
- [x] No appointment conflict detection (getAvailableSlots overlap check)
- [x] Invalid status transitions (statusMachine.ts)
- [x] Buffer time between appointments not enforced
- [x] maxPetsPerAppointment policy not enforced
- [x] Cancellation window policy not enforced
- [x] newClientMode 'blocked' not enforced
- [x] Vaccination expiration not checked on booking
- [x] Expired payment cards can process
- [x] Missing deposit validation
- [x] Service modifier silently skipped
- [x] BookingContext partially unused (guard redirects added)
- [x] No form validation with inline errors (formValidation.ts)
- [x] No confirmation dialogs for destructive actions (ConfirmDialog.tsx)
- [x] No success/error toast notifications for mutations (ToastContext)
- [x] Calendar accessibility gaps (aria-labels)
- [x] No cascading deletes (petsApi, groomersApi, staffApi)
- [x] Empty petId fallback in bookingApi
- [x] No max appointment duration validation
- [x] Payment status never updated post-booking
- [x] Pet-to-client validation in booking
- [x] Supabase client stub (fully migrated)
- [x] No real authentication (Supabase Auth + Google OAuth)

---

## Agent Reports Summary

### Agent 1: Navigation & Data Flows
**Verdict: EXCELLENT**
- All 31 routes valid and properly guarded
- All CRUD operations complete across 8 domains
- No redirect loops detected
- Booking flow has proper state guards and error handling
- 1 orphaned page (GroomersPage), 1 sidebar array mismatch

### Agent 2: UX Completeness
**Verdict: Needs Work**
- Empty states: partially wired (some pages, not all)
- Loading states: inconsistent (some skeleton, some plain text, some missing)
- Error handling: major gaps (mutations can silently fail for users)
- Form validation: partial (some forms validated, booking flow gaps)
- Accessibility: good fundamentals, missing details (skip link, aria-labels, focus states)
- Responsive: major mobile issues (calendar, booking times, staff table)

### Agent 3: Data Integrity & Logic
**Verdict: Solid with Edge Cases**
- Seed data well-structured and FK-consistent
- Status machine properly restrictive
- Type safety strong (no `as any` casts found)
- Service modifier pricing correct
- Key gaps: double-submit race condition, slot re-validation, groomer validation

---

## Recommended Fix Priority

### Week 1 — Critical + High Bucket A (ship blockers)

1. Add `isProcessing` guard to BookingConfirmPage (prevent double-submit)
2. Validate at least 1 service selected per pet before booking proceeds
3. Add empty state when groomer has no compatible services
4. Add loading skeletons to CalendarPage and DashboardPage
5. Add skip-to-main-content link to AppLayout
6. Validate groomer exists and is active before creating appointment
7. Mark required fields with visual indicator across all forms
8. Add inline validation to BookingStartPage name fields
9. Fix phone validation regex

### Week 2 — Remaining High + Medium UX

10. Add query error state display to all pages
11. Validate payment status before allowing "completed" transition
12. Add conflict detection on appointment drag-and-drop
13. Add "No slots" explanation context (time-off, fully booked, etc.)
14. Fix vaccination reminder boundary (day-of = expired)
15. Add payment failure retry button
16. Fix responsive issues (staff table, booking times grid, drawer landscape)

### Week 3 — Polish + Accessibility

17. Fix color contrast on pastel backgrounds
18. Add aria-labels to all icon-only buttons
19. Add visible focus states to dropdowns
20. Add unsaved changes warning to forms
21. Stack booking buttons on mobile
22. Add xl/2xl breakpoints for card grids
