# Stripe Integration Reference - Sit Pretty Club

## Overview

Full Stripe subscription billing integrated via Supabase Edge Functions. Supports Solo ($45/mo, $432/yr) and Studio ($95/mo, $912/yr) plans with a 14-day free trial and feature gating.

---

## Architecture

```
User clicks "Start Free Trial"
  → Frontend calls Edge Function (create-checkout-session)
    → Edge Function creates Stripe Checkout Session
      → User redirected to Stripe hosted checkout
        → User completes payment
          → Stripe fires webhooks
            → Edge Function (stripe-webhook) processes events
              → Supabase subscriptions table updated
                → Frontend reads subscription via React Query
                  → SubscriptionGate components enforce tier access
```

---

## Environment Variables

### Frontend (.env.local)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_DEV_BYPASS_SUBSCRIPTION=true     # Set to 'true' to bypass all subscription gates (dev only)
```

### Supabase Edge Functions (Dashboard > Edge Functions > Secrets)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SOLO_MONTHLY_PRICE_ID=price_...
STRIPE_SOLO_YEARLY_PRICE_ID=price_...
STRIPE_STUDIO_MONTHLY_PRICE_ID=price_...
STRIPE_STUDIO_YEARLY_PRICE_ID=price_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Stripe Dashboard Setup (Test Mode)

### 1. Create Products & Prices
- **Sit Pretty Club - Solo**: $45/mo (price_id: ___), $432/yr (price_id: ___)
- **Sit Pretty Club - Studio**: $95/mo (price_id: ___), $912/yr (price_id: ___)

### 2. Configure Customer Portal
Dashboard > Settings > Billing > Customer Portal:
- [x] View invoices
- [x] Update payment methods
- [x] Cancel subscription (at period end)
- [x] Switch plans (proration: always prorate)
- [ ] Pause subscription (disabled)
- Return URL: `{app-url}/app/settings`

### 3. Configure Webhook Endpoint
Dashboard > Developers > Webhooks:
- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.trial_will_end`

---

## Stripe CLI (Local Testing)

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Supabase
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
# Copy the whsec_... secret and set it as STRIPE_WEBHOOK_SECRET

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

---

## Test Cards

| Card Number | Scenario |
|------------|----------|
| `4242424242424242` | Success |
| `4000000000000002` | Card declined |
| `4000002500003155` | Requires 3D Secure authentication |
| `4000000000000341` | Attaches successfully, fails on charge |
| `4000000000009995` | Insufficient funds |

All test cards: any future expiry, any 3-digit CVC, any ZIP.

---

## Database Schema

### subscriptions table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| organization_id | UUID | FK to organizations, UNIQUE |
| stripe_customer_id | TEXT | Stripe customer ID |
| stripe_subscription_id | TEXT | Stripe subscription ID, UNIQUE |
| plan_tier | TEXT | 'solo' or 'studio' |
| billing_interval | TEXT | 'monthly' or 'yearly' |
| status | TEXT | trialing/active/past_due/canceled/unpaid/incomplete/incomplete_expired/paused |
| trial_start | TIMESTAMPTZ | |
| trial_end | TIMESTAMPTZ | |
| current_period_start | TIMESTAMPTZ | |
| current_period_end | TIMESTAMPTZ | |
| cancel_at_period_end | BOOLEAN | True if user canceled but access continues until period end |
| canceled_at | TIMESTAMPTZ | |

### billing_events table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| stripe_event_id | TEXT | UNIQUE, for idempotency |
| event_type | TEXT | e.g. 'customer.subscription.updated' |
| organization_id | UUID | FK to organizations |
| payload | JSONB | Full Stripe event object |

### organizations table (added column)
| Column | Type | Notes |
|--------|------|-------|
| stripe_customer_id | TEXT | UNIQUE, links org to Stripe customer |

---

## Edge Functions

| Function | Path | Method | Auth | Purpose |
|----------|------|--------|------|---------|
| create-checkout-session | `/functions/v1/create-checkout-session` | POST | Bearer token | Creates Stripe Checkout Session, returns redirect URL |
| create-portal-session | `/functions/v1/create-portal-session` | POST | Bearer token | Creates Customer Portal session, returns redirect URL |
| stripe-webhook | `/functions/v1/stripe-webhook` | POST | Stripe signature | Processes all webhook events |

### Deploying Edge Functions
```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

---

## Webhook Event Handling

| Event | Handler Action |
|-------|---------------|
| `checkout.session.completed` | Log only (subscription.created handles DB upsert) |
| `customer.subscription.created` | Upsert subscription row with full Stripe sub state |
| `customer.subscription.updated` | Upsert subscription row (handles upgrades, downgrades, renewals) |
| `customer.subscription.deleted` | Set status = canceled |
| `invoice.payment_succeeded` | Log only (subscription.updated already syncs) |
| `invoice.payment_failed` | Set status = past_due for active/trialing subs |
| `customer.subscription.trial_will_end` | Create in-app notification "Trial ending in 3 days" |

### Idempotency
Every event is checked against `billing_events.stripe_event_id` before processing. Duplicates are skipped.

---

## Feature Gating

### Gated Features (Studio-only)

| Feature Key | Where Gated | Component |
|------------|-------------|-----------|
| `multipleStaff` | StaffPage "Add Staff" button | `<SubscriptionGate feature="multipleStaff" silent>` |
| `rolePermissions` | StaffDetailPage permissions section | `<SubscriptionGate feature="rolePermissions">` |
| `serviceModifiers` | ServicesPage modifier management | `<SubscriptionGate feature="serviceModifiers">` |
| `advancedReports` | ReportsPage PDF/CSV export buttons | `<SubscriptionGate feature="advancedReports" silent>` |
| `smsReminders` | RemindersPage SMS toggle | `<SubscriptionGate feature="smsReminders">` |
| `staffScheduling` | StaffDetailPage scheduling section | `<SubscriptionGate feature="staffScheduling">` |
| `performanceTracking` | StaffDetailPage performance tab | `<SubscriptionGate feature="performanceTracking">` |

### Dev Bypass
Set `VITE_DEV_BYPASS_SUBSCRIPTION=true` in `.env.local` to unlock all features without a subscription.

### SubscriptionGate Usage
```tsx
import { SubscriptionGate } from '@/modules/ui/components/common'

// Shows upgrade prompt if feature unavailable
<SubscriptionGate feature="advancedReports">
  <ExportButtons />
</SubscriptionGate>

// Renders nothing if feature unavailable (for hiding buttons)
<SubscriptionGate feature="multipleStaff" silent>
  <AddStaffButton />
</SubscriptionGate>

// Custom fallback
<SubscriptionGate feature="smsReminders" fallback={<p>Upgrade to enable SMS</p>}>
  <SmsConfig />
</SubscriptionGate>
```

---

## Frontend Files

| File | Purpose |
|------|---------|
| `src/modules/database/api/billingApi.ts` | API calls to Edge Functions |
| `src/modules/database/hooks/useBilling.ts` | React Query hooks: useSubscription, useCreateCheckoutSession, useCreatePortalSession |
| `src/config/subscriptionGates.ts` | Feature-to-tier mapping |
| `src/modules/ui/context/SubscriptionContext.tsx` | SubscriptionProvider + useSubscriptionContext |
| `src/modules/ui/components/common/SubscriptionGate.tsx` | Feature gating component |
| `src/modules/ui/components/billing/BillingSection.tsx` | Billing card in Settings page |
| `src/lib/stripe/placeholder.ts` | Stripe.js client loader |

---

## Edge Cases

1. **Card expires**: invoice.payment_failed -> past_due -> grace period (still active) -> retry fails -> canceled
2. **Duplicate webhooks**: billing_events.stripe_event_id UNIQUE check -> skip
3. **Out-of-order events**: Upsert from full Stripe subscription object (last write wins)
4. **Already subscribed**: create-checkout-session checks for active sub -> returns error
5. **Trial expires no card**: customer.subscription.deleted -> canceled -> features locked
6. **User deletes account**: Supabase CASCADE deletes subscription row
7. **Past due grace**: SubscriptionContext treats past_due as active so user can fix payment

---

## Going Live Checklist

- [ ] Create products/prices in Stripe live mode
- [ ] Update Edge Function secrets with live keys (sk_live_..., pk_live_...)
- [ ] Create webhook endpoint for live mode
- [ ] Configure Customer Portal for live mode
- [ ] Test with real $0.50 charges
- [ ] Set `VITE_DEV_BYPASS_SUBSCRIPTION=false` in production
- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY` to pk_live_... in production
- [ ] Verify webhook delivery in Stripe Dashboard
- [ ] Test upgrade/downgrade/cancel flows
- [ ] Verify email receipts are being sent by Stripe
