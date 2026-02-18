# MISSING.md - App Completeness Audit

Last audited: 2026-02-18 (re-audited, run #7)

---

## Production Deployment Checklist

**App URL:** `https://sitprettyclub.com`
**Supabase Project:** `zswdgvusahmvwwbfuyle.supabase.co`
**Hosting:** Vercel

---

### 1. Supabase Dashboard -- Auth -- URL Configuration

| Setting | Value | Where |
|---------|-------|-------|
| Site URL | `https://sitprettyclub.com` | Supabase Dashboard > Auth > URL Configuration |
| Redirect URLs | `https://sitprettyclub.com/**` | Supabase Dashboard > Auth > URL Configuration |

- [ ] Set **Site URL** to `https://sitprettyclub.com` (used as the base for all auth redirect URLs)
- [ ] Add **Redirect URL** `https://sitprettyclub.com/**` (wildcard -- covers `/auth/callback` and any future routes)
- [ ] Optionally add explicit entry: `https://sitprettyclub.com/auth/callback`
- [ ] Keep `http://localhost:5173/**` for local development (do NOT remove)

### 2. Supabase Dashboard -- Auth -- Providers -- Google OAuth

| Setting | Value |
|---------|-------|
| Provider | Google |
| Status | Enabled |
| Client ID | From Google Cloud Console |
| Client Secret | From Google Cloud Console |

- [ ] Ensure Google provider is **enabled** in Supabase Dashboard > Auth > Providers
- [ ] Enter **Client ID** from Google Cloud Console OAuth 2.0 credentials
- [ ] Enter **Client Secret** from Google Cloud Console OAuth 2.0 credentials

### 3. Google Cloud Console -- OAuth 2.0 Credentials

Navigate to: [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials > OAuth 2.0 Client IDs

- [ ] **Authorized JavaScript Origins:** add `https://sitprettyclub.com`
- [ ] **Authorized Redirect URIs:** add `https://zswdgvusahmvwwbfuyle.supabase.co/auth/v1/callback`
- [ ] Keep `http://localhost:5173` in JavaScript Origins for local dev
- [ ] Keep `https://zswdgvusahmvwwbfuyle.supabase.co/auth/v1/callback` (same for both local and production -- Supabase handles the redirect)

### 4. Supabase Edge Function Secrets

Set via: Supabase Dashboard > Edge Functions > Manage Secrets, or CLI: `supabase secrets set KEY=VALUE`

**CORS:**

| Secret | Value | Notes |
|--------|-------|-------|
| `ALLOWED_ORIGIN` | `https://sitprettyclub.com` | Used by `_shared/cors.ts`; production origin is also hardcoded in DEFAULT_ALLOWED_ORIGINS as a fallback |

- [ ] Set `ALLOWED_ORIGIN` to `https://sitprettyclub.com`

**Stripe (Billing):**

| Secret | Value | Notes |
|--------|-------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Used by `_shared/stripe.ts` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Used by `stripe-webhook/index.ts` |
| `STRIPE_SOLO_MONTHLY_PRICE_ID` | `price_...` | Stripe Price ID for Solo monthly |
| `STRIPE_SOLO_YEARLY_PRICE_ID` | `price_...` | Stripe Price ID for Solo yearly |
| `STRIPE_STUDIO_MONTHLY_PRICE_ID` | `price_...` | Stripe Price ID for Studio monthly |
| `STRIPE_STUDIO_YEARLY_PRICE_ID` | `price_...` | Stripe Price ID for Studio yearly |

- [ ] Set `STRIPE_SECRET_KEY` (use `sk_live_` for production, `sk_test_` for testing)
- [ ] Set `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard > Webhooks > endpoint signing secret)
- [ ] Set all 4 `STRIPE_*_PRICE_ID` values (from Stripe Dashboard > Products > Price IDs)

**Resend (Email):**

| Secret | Value | Notes |
|--------|-------|-------|
| `RESEND_API_KEY` | `re_...` | Used by `_shared/resend.ts` |
| `RESEND_FROM_EMAIL` | `noreply@sitprettyclub.com` (optional) | Falls back to `onboarding@resend.dev` (sandbox) |

- [ ] Set `RESEND_API_KEY` from Resend dashboard
- [ ] (Optional) Set `RESEND_FROM_EMAIL` to a verified domain email (e.g., `noreply@sitprettyclub.com`)
- [ ] To use a custom from-email, verify domain in Resend dashboard first

**Supabase (auto-provided, usually pre-set):**

| Secret | Value | Notes |
|--------|-------|-------|
| `SUPABASE_URL` | `https://zswdgvusahmvwwbfuyle.supabase.co` | Usually auto-set by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Usually auto-set; used by `_shared/supabase-admin.ts` for admin operations |

- [ ] Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (these are typically auto-injected by Supabase for edge functions)

### 5. Vercel Environment Variables

Set via: Vercel Dashboard > Project Settings > Environment Variables (set for Production environment)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://zswdgvusahmvwwbfuyle.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key (safe for client-side) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | Stripe publishable key (safe for client-side) |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIza...` | Google Maps Places API key |
| `VITE_APP_URL` | `https://sitprettyclub.com` | App base URL |
| `VITE_DEV_BYPASS_SUBSCRIPTION` | `false` | Must be `false` in production (code also guards with `import.meta.env.DEV`) |
| `VITE_SHOW_DEMO_LOGIN` | `false` | Must be `false` in production |

- [ ] Set `VITE_SUPABASE_URL` to `https://zswdgvusahmvwwbfuyle.supabase.co`
- [ ] Set `VITE_SUPABASE_ANON_KEY` (from Supabase Dashboard > Settings > API > anon public key)
- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY` (use `pk_live_` for production, `pk_test_` for testing)
- [ ] Set `VITE_GOOGLE_MAPS_API_KEY` (from Google Cloud Console > APIs & Services > Credentials)
- [ ] Set `VITE_APP_URL` to `https://sitprettyclub.com`
- [ ] Ensure `VITE_DEV_BYPASS_SUBSCRIPTION` is `false` (or unset)
- [ ] Ensure `VITE_SHOW_DEMO_LOGIN` is `false` (or unset)

### 6. Stripe Dashboard -- Webhook Endpoint

| Setting | Value |
|---------|-------|
| Endpoint URL | `https://zswdgvusahmvwwbfuyle.supabase.co/functions/v1/stripe-webhook` |
| Events | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed` |

- [ ] Create webhook endpoint pointing to the Supabase edge function URL above
- [ ] Subscribe to all required events (listed above)
- [ ] Copy the **Signing Secret** (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET` in Supabase secrets
- [ ] Send a test event from Stripe to verify the webhook is receiving and processing correctly

### 7. Google Maps API -- Key Restrictions (Recommended)

- [ ] Restrict API key to **HTTP referrers**: `https://sitprettyclub.com/*`
- [ ] Enable only the **Places API** (and Maps JavaScript API) for this key
- [ ] Set a billing alert/quota limit to prevent unexpected charges

### 8. Post-Deployment Verification

After all configuration is complete, verify:

- [ ] Visit `https://sitprettyclub.com` -- landing page loads
- [ ] Click "Sign in with Google" -- redirects to Google, then back to `/auth/callback`, then to `/app/dashboard`
- [ ] Email/password login works
- [ ] Navigate to Settings > Email Settings > send a test email -- email arrives
- [ ] Navigate to Billing > subscribe to a plan -- Stripe Checkout opens, payment completes, redirects back to `/app/billing`
- [ ] Booking flow: visit `/book/{orgSlug}/start` -- full booking flow works including address autocomplete
- [ ] Check browser console for CORS errors on edge function calls
- [ ] Check Supabase Dashboard > Edge Functions > Logs for any runtime errors

---

## Critical

- [x] [RESOLVED] [Critical] [A] **NEW-R7** Cross-org client data leak via `getByEmail()`: `clientsApi.getByEmail()` queries ALL organizations — fixed: now requires `organizationId` param and uses `lookup_client_by_email` RPC function. Booking flow uses `getByIdForBooking()` RPC. (clientsApi.ts)
- [x] [RESOLVED] [Critical] [A] **NEW-R7** RLS: anonymous SELECT on `clients` table was completely unscoped — fixed: dropped anon SELECT policy, replaced with SECURITY DEFINER RPC functions (`lookup_client_by_email`, `search_clients_for_booking`, `get_client_for_booking`) that enforce org scoping internally. (011_secure_anon_rpc.sql)
- [x] [RESOLVED] [Critical] [A] **NEW-R7** RLS: anonymous SELECT on `pets` table was completely unscoped — fixed: dropped anon SELECT policy, replaced with SECURITY DEFINER RPC functions (`get_pets_for_booking`, `get_pet_for_booking`) that enforce org scoping internally. (011_secure_anon_rpc.sql)
- [x] [RESOLVED] [Critical] [A] Cross-org appointment data leak: `getByClientId()` and `getByGroomerId()` in calendarApi.ts query WITHOUT `organization_id` filter — fixed: added `organizationId` param + `.eq('organization_id')` filter to `getByClientId()`, `getByGroomerId()`, and `checkForConflicts()`; updated all call sites including hooks
- [x] [RESOLVED] [Critical] [A] Unassigned appointments skip ALL conflict checking: when `groomerId` is undefined, `checkForConflicts()` was never called — fixed: added `checkForUnassignedConflicts()` function + `else` branches in `create()` and `update()` to check for overlapping unassigned appointments
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
- [x] [RESOLVED] [High] [B] Stripe subscription billing now live: Products, prices, checkout, webhooks, and billing page all working in test mode. Fixed webhook `current_period_start`/`current_period_end` field location bug. Edge functions deployed with `--no-verify-jwt` for PKCE ES256 compatibility.
- [ ] [High] [B] Stripe booking payment still mocked: mockStripe.ts simulates payment processing during booking flow — real Stripe payment intent needed for in-app booking payments (separate from subscription billing)
- [x] [RESOLVED] [High] [B] Email notifications live via Resend: edge function `send-email` deployed, 6 email templates (test, ready-for-pickup, appointment reminder, vaccination reminder, booking confirmation, new booking alert). Sender: `onboarding@resend.dev` (sandbox).
- [x] [RESOLVED] [High] [A] `checkForConflicts()` in calendarApi.ts doesn't filter by `organization_id` — fixed: added `organizationId` param + `.eq('organization_id')` filter
- [x] [RESOLVED] [High] [A] BookingConfirmPage null guard missing on service modifier price — fixed: added optional chaining on `service.modifiers?.find()` and `Math.max(0, servicePrice)` floor to prevent negative prices from modifier stacking
- [x] [RESOLVED] [High] [A] Performance API null check missing on `finalPrice` — fixed: `Number(service.finalPrice) || 0` guards against NaN/undefined corrupting revenue totals
- [x] [RESOLVED] [High] [A] ServiceForm missing validation: validation added requiring non-empty name, positive duration, non-negative price
- [ ] [High] [A] **NEW-R7** 12h time format leaks into parsing: `getAvailableSlots()` formats slots as `h:mm a` (e.g., "9:00 AM"), but `validateAdvanceBooking()` and `validateTimeSlot()` pass these to `parseISO()` which expects 24h — produces Invalid Date, silently disabling advance booking validation and allowing past bookings (calendarApi.ts:486, bookingApi.ts:146)
- [ ] [High] [A] **NEW-R7** `useDeletePet` doesn't invalidate `['pets', 'client', clientId]` cache key — deleted pets remain visible on ClientDetailPage until manual refresh. `useUpdatePet` has same gap. (usePets.ts:59-70)
- [ ] [High] [A] **NEW-R7** `performanceApi.getTeamPerformance()` N+1 query: fires individual `getStaffPerformance()` DB query per staff member instead of computing from already-fetched org-wide data (performanceApi.ts:216)
- [ ] [High] [A] **NEW-R7** `BookingIntakePage` no empty state when org has zero services: pet tabs render empty category sections with nothing to click — user sees blank page with no guidance
- [ ] [High] [A] **NEW-R7** `GroomerForm` has no client-side JS validation: `handleSubmit` calls `onSubmit(formData)` directly without any field checks — relies solely on HTML `required` attribute (GroomerForm.tsx:65)
- [ ] [High] [A] **NEW-R7** Modal uses `aria-label` instead of `aria-labelledby`: dialog name not tied to visible `<h2>` heading — screen readers read both separately. Should use `aria-labelledby="dialog-title-id"` (Modal.tsx:67)
- [ ] [High] [A] **NEW-R7** `GroomerForm` `<select>` elements not programmatically associated with `<label>` via htmlFor/id — screen readers cannot announce label when select is focused (GroomerForm.tsx:135)
- [ ] [High] [A] **NEW-R7** RLS: anonymous INSERT on `clients`/`pets` has no `organization_id` validation in `WITH CHECK` — anonymous user can insert records into any arbitrary org (002_rls_policies.sql)
- [ ] [High] [B] **NEW-R7** No rate limiting on public booking email lookup — combined with unscoped RLS, enables client email enumeration attack (BookingStartPage)
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
- [ ] [Medium] [A] **NEW-R5** `getAvailableSlots()` doesn't validate groomerId belongs to organizationId — cross-org groomer availability data leak (calendarApi.ts lines 376-501) *(note: conflict checks now org-scoped, but slot generation still doesn't validate groomer-org ownership)*
- [ ] [Medium] [A] **NEW-R6** StaffPage time-off approve/reject has no confirmation dialog: buttons immediately mutate without confirm — accidental rejection cannot be undone (StaffPage.tsx lines 119-123)
- [ ] [Medium] [A] **NEW-R6** Unassigned appointments excluded from groomer performance metrics: `performanceApi` filters out null groomerId — revenue appears in org totals but not in any groomer's stats, making metrics impossible to reconcile (performanceApi.ts line 213)
- [ ] [Medium] [A] **NEW-R6** Service data not hydrated in appointments: `calendarApi` maps `serviceId` but never populates `service` object — `service?.name` always falls back to "Unknown Service" in performance reports (calendarApi.ts lines 43-48)
- [ ] [Medium] [A] **NEW-R6** Pets with zero vaccination records bypass vaccination validation: loop over `pet.vaccinations` never executes when array is empty — unvaccinated pets are bookable (validators.ts lines 64-84)
- [ ] [Medium] [A] **NEW-R6** BookingConfirmPage passes empty string to useClientPets when clientId is undefined: existing pet names show as "Pet" instead of real name (BookingConfirmPage.tsx line 43)
- [ ] [Medium] [A] **NEW-R6** ReportsPage charts show empty axes when no data in date range: Recharts renders blank chart area with no "No data available" message — confusing UX
- [ ] [Medium] [A] **NEW-R6** DashboardPage stat cards have no error boundary: if any stat card fails to render (bad icon, bad data), entire stats grid crashes
- [ ] [Medium] [A] **NEW-R6** CalendarPage CustomEvent has no error boundary: malformed appointment data crashes entire calendar view
- [ ] [Medium] [A] **NEW-R6** ClientDetailPage not-found state missing back button: user stuck on error page, must use browser back (unlike PetDetailPage which has back link)
- [ ] [Medium] [A] **NEW-R7** `useAddVaccination`/`useRemoveVaccination` don't invalidate `['pets']` or `['pets', 'client']` list queries — stale vaccination data on PetsPage and BookingPetsPage (usePets.ts:84,96)
- [ ] [Medium] [A] **NEW-R7** `BookingConfirmPage` guard only checks `selectedTimeSlot`, not earlier prerequisites — stale sessionStorage with `selectedTimeSlot` set lets user reach confirm page with invalid pet/service data (BookingConfirmPage.tsx:152)
- [ ] [Medium] [A] **NEW-R7** `performanceApi.fetchAppointments()` pets array always empty — `row.pets` is always `undefined` because pets are in junction table, not JSONB column — service breakdown always $0 (performanceApi.ts:139)
- [ ] [Medium] [A] **NEW-R7** `staffApi.getStaffAvailability()` silently inserts default row during a read — hidden write side effect, possible duplicate rows with no unique constraint on `staff_id` (staffApi.ts:205)
- [ ] [Medium] [A] **NEW-R7** Working hours parsing ignores minutes: `split(':').map(Number)` discards minutes — groomer `9:30–5:30` generates slots starting at 9:00 and ending at 5:00 (calendarApi.ts:450)
- [ ] [Medium] [A] **NEW-R7** `validateCancellationWindow` blocks in-progress cancellations: `isPast(startTime)` returns true for started appointments, but `statusMachine` allows `in_progress → cancelled` — admin can't cancel mid-grooming (validators.ts:44)
- [ ] [Medium] [A] **NEW-R7** `BookingConfirmPage` price breakdown renders $0 before data loads: `usePolicies`, `useActiveServices`, `useGroomers` loading states not surfaced — totals jump after query resolves
- [ ] [Medium] [A] **NEW-R7** `BookingGroomerPage` no loading state for groomer list: groomer grid shows only "Any Available" initially, then groomers pop in after query resolves
- [ ] [Medium] [A] **NEW-R7** `PoliciesPage` no `isError` branch: if Supabase query fails, `policies` is undefined, form shows defaults — saving overwrites real policies with blank defaults (PoliciesPage.tsx)
- [ ] [Medium] [A] **NEW-R7** `SettingsPage` `isError` destructured but never used in render — org load failure shows empty form silently (SettingsPage.tsx:122)
- [ ] [Medium] [A] **NEW-R7** `AppLayout` `handleCreateAppointment` error silently swallowed: catch block has `/* Error handled by react-query */` comment but no `onError` on mutation — no toast shown (AppLayout.tsx:130)
- [ ] [Medium] [A] **NEW-R7** `BookingStartPage` disabled Continue button gives no explanation: email/phone required for `canContinue` but no validation message tells user what's missing
- [ ] [Medium] [A] **NEW-R7** `BookingPetsPage` new pet form has no validation: pet with no name or breed can be added inline
- [ ] [Medium] [A] **NEW-R7** `BookingTimesPage` slot buttons have no date context for screen readers: "9:00 AM" button repeated 7 times (once per day column) with no way to distinguish which day (BookingTimesPage.tsx:326)
- [ ] [Medium] [A] **NEW-R7** `BookingGroomerPage` selection buttons lack `aria-pressed` state — screen reader users can't tell which groomer is selected
- [ ] [Medium] [A] **NEW-R7** `ClientCard`/`PetCard` hidden delete buttons keyboard-inaccessible: `opacity-0 group-hover:opacity-100` makes buttons invisible and unreachable for keyboard/touch users
- [ ] [Medium] [A] **NEW-R7** `StaffPage` Approve/Reject time-off buttons lack context: no `aria-label` indicating whose request — screen reader hears "Approve, button" with no context
- [ ] [Medium] [A] **NEW-R7** `create-checkout-session` redirect URL derived from request `Origin` header — attacker can craft `Origin: https://evil.com` to redirect post-payment to malicious site (create-checkout-session/index.ts:93)
- [ ] [Medium] [A] **NEW-R7** Dual-tab double-submission creates duplicate clients: no `email + organization_id` unique constraint in DB — concurrent submissions from two browser tabs create two client records
- [ ] [Medium] [A] **NEW-R7** `preferred_groomer_id` is TEXT with no FK — no referential integrity, deleted groomer leaves stale reference (001_initial_schema.sql:83)
- [ ] [Medium] [A] **NEW-R7** `groomers.user_id` is TEXT with no FK to `auth.users` — deleted auth user leaves stale `user_id` string (001_initial_schema.sql:126)
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
- [ ] [Low] [A] **NEW-R6** BookingStartPage email not trimmed before validation: leading/trailing whitespace causes valid emails to fail (BookingStartPage.tsx line 37)
- [ ] [Low] [A] **NEW-R6** Calendar route date params not validated: malformed `?date=` param silently fails to filter instead of showing error (CalendarPage.tsx)
- [ ] [Low] [A] **NEW-R6** Booking flow lacks error boundary: BookingLayout has no error recovery — network errors require manual page refresh
- [ ] [Low] [A] **NEW-R6** ServiceForm duration has no upper bound: accepts 999+ minute services, caught later by max duration validator but poor UX
- [ ] [Low] [A] **NEW-R6** BookingStartPage email lookup silently takes first match on multiple results: `clients.find()` returns first hit without warning (BookingStartPage.tsx line 48)
- [ ] [Low] [A] **NEW-R6** PetDetailPage shows "Unknown Client" for deleted client with no reassign prompt or warning
- [ ] [Low] [A] **NEW-R6** ConfirmDialog should use aria-describedby for message text: generic `aria-label="Dialog"` fallback is unhelpful for screen readers
- [ ] [Low] [A] **NEW-R6** Hardcoded default business hours 8-18 in slot generation: if no groomer selected, slots don't match actual salon hours — should read from organization config (calendarApi.ts lines 386-389)
- [ ] [Low] [A] **NEW-R6** Inactive/deprecated services can still be booked: `bookingApi` fetches service by ID but doesn't check `isActive` flag (bookingApi.ts lines 68-69)
- [ ] [Low] [A] **NEW-R6** Seed data org ID mismatch: `seed.ts` uses `ORG_ID = 'org-1'` but `seed-supabase.ts` uses `crypto.randomUUID()` — incompatible seeding contexts
- [ ] [Low] [A] **NEW-R6** Email validation regex too basic: doesn't validate TLD length, internationalized domains, or very long addresses — invalid emails silently fail at Resend (emailApi.ts lines 4-7)
- [ ] [Low] [A] **NEW-R6** Unused `dayErrors` state variable in WeeklyScheduleEditor.tsx: declared line 22 but never read — TypeScript build warning
- [ ] [Low] [A] **NEW-R7** `BookingTimesPage` "Previous Week" button disabled mid-week on current week: `isBefore(weekStart, today)` is true Mon–Sat because weekStart is Sunday — should compare against previous week boundary (BookingTimesPage.tsx:248)
- [ ] [Low] [A] **NEW-R7** `BookingTimesPage` caps slots at 8/day with non-interactive "+N more" text: salon with 30-min intervals 8am–8pm has 24 slots, 16 are unreachable (BookingTimesPage.tsx:305)
- [ ] [Low] [A] **NEW-R7** `BookingSuccessPage` eslint-disabled hook deps suppression: `// eslint-disable-line react-hooks/exhaustive-deps` on useEffect — code smell, `resetBookingState` is stable but lint suppression hides issues (BookingSuccessPage.tsx:17)
- [ ] [Low] [A] **NEW-R7** `PermissionGate` with no `permission` prop silently allows all authenticated users through — intentional but undocumented footgun (PermissionGate.tsx:77)
- [ ] [Low] [A] **NEW-R7** `getIssues()` filters by `updated_at` instead of appointment `start_time` — cancellation from last month appears in "this week's issues" if cancelled yesterday (calendarApi.ts:226)
- [ ] [Low] [A] **NEW-R7** `vaccination_reminders`/`in_app_notifications` use TEXT for FK-like fields with no constraints — stale records persist after entity deletion
- [ ] [Low] [A] **NEW-R7** No Sarah Johnson availability in seed data: only Mike and Lisa get seed availability — Sarah auto-inserts default on first query (seed-supabase.ts:690)
- [ ] [Low] [A] **NEW-R7** Expired Mastercard (exp 2025) in seed data — already stale as of Feb 2026 (seed-supabase.ts:313)
- [ ] [Low] [A] **NEW-R7** `clientsApi.delete()` has no transaction: 6 sequential DELETEs with no `BEGIN/COMMIT` — partial network failure orphans data (clientsApi.ts:143)
- [ ] [Low] [A] **NEW-R7** LoginPage Google button SVGs lack `aria-hidden="true"` — screen readers may read SVG paths alongside button text
- [ ] [Low] [A] **NEW-R7** `BookingStartPage` New/Returning client toggle buttons lack `aria-pressed` or `role="radio"` — screen readers can't convey selection state
- [ ] [Low] [A] **NEW-R7** DashboardPage status note `truncate` with no `title` attribute — full text inaccessible when truncated
- [ ] [Low] [A] **NEW-R7** DashboardPage `handleConfirmStatusWithNotes` calls `updateStatus.mutateAsync` with no try/catch — errors swallowed silently
- [ ] [Low] [A] **NEW-R7** StaffPage approve/reject time-off calls `.mutate()` with no `onError` callback — failure gives no user feedback
- [ ] [Low] [A] **NEW-R7** `PaymentMethodCard` on BillingPage has no loading indicator — shows empty until `useInvoices` query resolves
- [ ] [Low] [A] **NEW-R7** `BookingGroomerPage` no empty state message when zero active groomers after filtering — only "Any Available" with no explanation
- [ ] [Low] [A] **NEW-R7** PoliciesPage fee % inputs have no upper-bound JS validation — `max={100}` HTML attribute can be bypassed by typing
- [ ] [Low] [A] **NEW-R7** SettingsPage `replyToEmail` field has no email format validation — invalid addresses accepted silently
- [ ] [Low] [A] **NEW-R7** `calendarApi.update()` may strip fields when called with partial data: only fetches existing record when time/groomer changes (calendarApi.ts:347)
- [ ] [Low] [B] Feature flags hardcoded: onlinePayments, smsReminders, petPhotos, etc. are static booleans (flags.ts)

## Bucket B (Requires External APIs) - Summary

- [x] [RESOLVED] [High] [B] Stripe subscription billing now live (test mode) — products, prices, checkout, webhooks, billing page all working
- [ ] [High] [B] Stripe booking payment still mocked: mockStripe.ts simulates payment during booking — needs real Stripe payment intent
- [x] [RESOLVED] [High] [B] Email notifications live via Resend: 6 templates, edge function deployed
- [ ] [High] [B] **NEW** RLS policies allow anonymous client creation: needs rate limiting, CAPTCHA, or tighter scoping
- [ ] [High] [B] **NEW-R4** RLS policies for staff_availability and time_off_requests use `USING(true)` — exposes all orgs' data globally
- [ ] [High] [B] **NEW-R7** No rate limiting on public booking email lookup — enables client email enumeration attack
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
| Critical | 0               | 18                  | 0               | 0                   | 0          |
| High     | 8               | 41                  | 4               | 2                   | 12         |
| Medium   | 95              | 1                   | 1               | 2                   | 96         |
| Low      | 77              | 0                   | 1               | 0                   | 78         |
| **Total**| **180**         | **60**              | **6**           | **4**               | **186**    |

*Run #7 audit (2026-02-18): Full 3-agent parallel audit (navigation + data flows, UX completeness, data integrity + business logic). Found 3 new Critical (cross-org `getByEmail`, unscoped RLS on clients/pets tables), 9 new High-A (12h time format parsing bug, pet cache invalidation gaps, N+1 performance query, missing form validation, a11y issues), 1 new High-B (email enumeration via rate limiting gap), 21 new Medium (checkout redirect vulnerability, cancellation logic conflict, loading/error state gaps, a11y labels, schema FK gaps), 19 new Low (seed data staleness, a11y polish, slot pagination, validation edges). Priority: fix 3 Critical RLS/data leak issues first, then 12h time format bug.*

*Run #6 audit (2026-02-17): Full 3-agent parallel audit (navigation, UX, data integrity). Found 1 new Critical (unassigned appointments skip conflict checking), 2 new High (price calc null guards, performance metric corruption), 9 new Medium (missing confirmations, error boundaries, data hydration gaps), 13 new Low (validation edges, accessibility, build warnings). Fixed both Critical-A issues: cross-org data leak (added org filter to 3 functions + hooks) and unassigned conflict checking (added checkForUnassignedConflicts + else branches).*
