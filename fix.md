# fix.md - Enforce Subscription Staff Limits (Frontend + Backend)

Generated: 2026-02-12

---

## Context

The subscription gating audit revealed that while the UI correctly hides Studio-only features behind `SubscriptionGate` components, there is **zero backend enforcement**. A Solo user could bypass all gates via browser console or direct API calls. Additionally, the pricing page advertises "1 staff account" for Solo but the app never counts or limits staff.

**Goal:** Enforce staff limits per tier (Solo = 1, Studio = unlimited) at both the frontend UI and backend (RLS + API) layers, while preserving the `VITE_DEV_BYPASS_SUBSCRIPTION=true` dev bypass for testing.

### Competitor Research Summary

| Competitor | Low Tier | Staff | Mid Tier | Staff |
|---|---|---|---|---|
| MoeGo | $49/mo | 1 | $99/mo | Unlimited |
| DaySmart Pet | $29/mo | 1 | $129/mo | Unlimited |
| Pawfinity | $60/mo | Unlimited | $110/mo | Unlimited |
| Groomer.io | $99/mo | Unlimited | — | — |
| PetLinx | $74/mo | 2 | +$15/user | — |
| Vagaro | $30/mo | 1 calendar | +$10/calendar | 7+ cap |
| Cuddles | Free | 1 | $195/mo | Unlimited |

**Our pricing:** Solo $45/mo (1 staff) / Studio $95/mo (unlimited) — competitive, undercuts DaySmart and Gingr for unlimited.

---

## Changes Overview

### 1. Add staff limit constants to subscription config
**File:** `src/config/subscriptionGates.ts`

- Add `TIER_STAFF_LIMITS` constant: `{ solo: 1, studio: Infinity }`
- Add `getStaffLimit(tier)` helper function
- Export for use in both frontend and edge functions

### 2. Add `staffCount` and `canAddStaff` to SubscriptionContext
**File:** `src/modules/ui/context/SubscriptionContext.tsx`

- Fetch current staff/groomer count using existing `useGroomers()` hook
- Compute `canAddStaff`: `devBypass || staffCount < getStaffLimit(planTier)`
- Expose `canAddStaff` and `staffCount` on the context value
- Dev bypass always returns `canAddStaff = true`

### 3. Update StaffPage to use `canAddStaff` instead of `multipleStaff` feature gate
**File:** `src/modules/ui/pages/app/StaffPage.tsx`

- Replace `<SubscriptionGate feature="multipleStaff" silent>` around "Add Staff" button
- Use `canAddStaff` from `useSubscriptionContext()` instead
- When `!canAddStaff && !devBypass`: show a disabled button or inline message ("Solo plan includes 1 staff member. Upgrade to add more.")
- Keep existing `PermissionGate` wrapper

### 4. Add staff count validation to staffApi.create()
**File:** `src/modules/database/api/staffApi.ts`

- Before inserting a new groomer, query current groomer count for the org
- Query the org's subscription tier
- If `count >= TIER_STAFF_LIMITS[tier]`, throw an error: "Staff limit reached for your plan"
- Skip check if no subscription exists (allow 1 for grace) or if dev bypass header present

### 5. Add RLS policy for staff limit enforcement
**File:** `supabase/migrations/006_staff_limits.sql` (new migration)

- Create a helper function `get_org_staff_count(org_id)` that returns `COUNT(*)` from groomers
- Create a helper function `get_org_plan_tier(org_id)` that returns `plan_tier` from subscriptions
- Add RLS policy on `groomers` table for INSERT:
  ```sql
  CREATE POLICY "Enforce staff limit per subscription tier"
    ON groomers FOR INSERT WITH CHECK (
      -- Studio tier: unlimited
      (get_org_plan_tier(organization_id) = 'studio'
        AND EXISTS (SELECT 1 FROM subscriptions WHERE organization_id = groomers.organization_id AND status IN ('trialing', 'active', 'past_due')))
      OR
      -- Solo tier: max 1
      (get_org_plan_tier(organization_id) = 'solo'
        AND get_org_staff_count(organization_id) < 1
        AND EXISTS (SELECT 1 FROM subscriptions WHERE organization_id = groomers.organization_id AND status IN ('trialing', 'active', 'past_due')))
      OR
      -- No subscription: allow 1 (grace period / onboarding)
      (get_org_plan_tier(organization_id) IS NULL
        AND get_org_staff_count(organization_id) < 1)
    );
  ```
- This enforces limits at the database level regardless of how the API is called

### 6. Add backend enforcement to other Studio-only features (service modifiers)
**File:** `supabase/migrations/006_staff_limits.sql` (same migration)

- Add RLS policy on `service_modifiers` for INSERT:
  ```sql
  CREATE POLICY "Only Studio tier can add service modifiers"
    ON service_modifiers FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.organization_id = (
          SELECT organization_id FROM services WHERE id = service_modifiers.service_id
        )
        AND s.plan_tier = 'studio'
        AND s.status IN ('trialing', 'active', 'past_due')
      )
    );
  ```

### 7. Update landing page pricing copy
**File:** `src/modules/ui/pages/landing/components/PricingSection.tsx`

- Verify Solo plan explicitly says "1 staff account"
- Verify Studio plan says "Unlimited staff accounts"

### 8. Update tests
- Update `src/config/subscriptionGates.test.ts` — add tests for `getStaffLimit()` and `TIER_STAFF_LIMITS`
- Add new test: `src/modules/database/api/staffApi.test.ts` — test staff limit validation logic

---

## Dev Bypass Behavior

- `VITE_DEV_BYPASS_SUBSCRIPTION=true` → `canAddStaff = true` always (frontend)
- Backend RLS: The bypass login user should have a subscription record in the DB (or use the service role key for seeding). The dev bypass only affects frontend rendering, not DB policies.
- For local development, the seed script should create a `studio` subscription for the test org so the RLS policies don't block anything.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/config/subscriptionGates.ts` | Add `TIER_STAFF_LIMITS`, `getStaffLimit()` |
| `src/modules/ui/context/SubscriptionContext.tsx` | Add `canAddStaff`, `staffCount` |
| `src/modules/ui/pages/app/StaffPage.tsx` | Replace feature gate with `canAddStaff` check |
| `src/modules/database/api/staffApi.ts` | Add staff limit validation before create |
| `supabase/migrations/006_staff_limits.sql` | New: RLS policies for groomers + service_modifiers |
| `src/modules/ui/pages/landing/components/PricingSection.tsx` | Verify pricing copy accuracy |
| `src/config/subscriptionGates.test.ts` | Add staff limit tests |

---

## Execution Plan

### Phase 1: Config & Types (15 min)
1. Add `TIER_STAFF_LIMITS` and `getStaffLimit()` to `subscriptionGates.ts`

### Phase 2: Frontend Enforcement (30 min)
2. Add `canAddStaff` and `staffCount` to `SubscriptionContext`
3. Update `StaffPage` to use count-based check instead of feature gate
4. Verify landing page pricing copy

### Phase 3: Backend Enforcement (45 min)
5. Add staff count validation to `staffApi.create()`
6. Create migration `006_staff_limits.sql` with RLS policies for groomers and service_modifiers

### Phase 4: Tests (30 min)
7. Add tests for `getStaffLimit()` and `TIER_STAFF_LIMITS`
8. Add tests for staff limit validation in staffApi

### Phase 5: Verification (15 min)
9. Run all tests, lint, TypeScript check
10. Manual test with dev bypass ON (all features work)
11. Manual test with dev bypass OFF (limits enforced)

---

## Verification Checklist

- [ ] `npx vitest run` — all tests pass
- [ ] `npx eslint .` — zero errors
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Dev bypass ON → Staff page "Add Staff" works, all features unlocked
- [ ] Dev bypass OFF + Solo → Staff page shows limit message after 1 staff
- [ ] Dev bypass OFF + Solo → `staffApi.create()` in console throws error
- [ ] Dev bypass OFF + Studio → All features accessible, unlimited staff
- [ ] RLS migration applied → INSERT on groomers blocked for Solo at limit
- [ ] Service modifiers INSERT blocked for Solo tier at DB level
