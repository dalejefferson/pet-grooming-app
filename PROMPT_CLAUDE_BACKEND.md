# Claude Prompt — Supabase Backend + Integrations

Copy and paste the following prompt into Claude:

```text
You are Claude, acting as a senior full‑stack engineer. Implement a Supabase‑backed backend and integrations for this repo.

REPO CONTEXT
- Vite + React 19 + TypeScript + Tailwind v4, React Router, TanStack Query.
- Existing domain types live in `src/modules/database/types/index.ts`.
- Current data layer uses localStorage/mock APIs; replace with Supabase.

GOALS (MUST IMPLEMENT)
1) Supabase Auth: email/password + magic link.
2) Multi‑tenant org model with strict RLS by `organization_id`.
3) Supabase database schema matching existing types.
4) Storage buckets for images: private + signed URLs.
5) Stripe monthly subscriptions: Starter/Pro/Enterprise using Checkout + webhooks.
6) Notifications: appointment + vaccination reminders via Resend email; Twilio wired but DISABLED.
7) In‑app notifications stored in DB.
8) Google Maps: address autocomplete + map display for org/client addresses.
9) PostHog: frontend analytics + events.

OPERATIONAL / SECURITY EXTRAS (MUST INCLUDE)
- Env separation: dev/stage/prod Supabase projects + Stripe keys; seed data only in dev.
- RLS hardening: tenant tables require `organization_id`, membership table (auth user ↔ org), no access without membership.
- Soft delete + audit: `deleted_at` or `is_active` on core entities; optional `audit_log`.
- Webhook idempotency: store Stripe event IDs; ignore duplicates.
- Billing UX: Stripe Customer Portal for self‑serve upgrades/cancel.
- Email deliverability: verified domain, templates, unsubscribe token for marketing emails.
- Scheduling: Supabase cron/Edge Function for reminders (no client scheduling).
- Storage policies: file type/size limits; expiring signed URLs; optional virus‑scan hook.
- Maps cost controls: API key restricted to domains; lazy load; cache geocodes.
- Telemetry/errors: PostHog events + error logging (Supabase logs; optionally mention Sentry).
- Migrations: SQL migrations in repo + Supabase CLI flow + rollback notes.
- Security: rate‑limit auth/booking endpoints; optional CAPTCHA for public booking if abuse.

USE SUPABASE MCPs
- Use Supabase MCPs to create tables, enums, indexes, constraints, RLS, buckets, policies, and Edge Functions.
- Insert seed data only in dev.

SCHEMA OUTLINE (ALIGN TO TYPES)
Create tables (or equivalent) for:
- `organizations`
- `staff_members` (auth user ↔ org + role)
- `clients`
- `pets`
- `vaccinations`
- `services`
- `service_modifiers`
- `appointments`
- `booking_policies`
- `reminder_schedules`
- `vaccination_reminder_settings`
- `vaccination_reminders`
- `in_app_notifications`
- `payment_methods`
- `subscriptions`
- `stripe_events` (idempotency)

EDGE FUNCTIONS
- `create_checkout_session`
- `stripe_webhook`
- `customer_portal`
- `send_reminders`
- `sign_storage_url`

FRONTEND UPDATES
- Replace localStorage APIs with Supabase queries in `src/modules/database/api/*` and hooks.
- Add Supabase client and auth session handling.
- Add PostHog init + event tracking (login/signup/booking steps/subscription changes).
- Add Google Maps autocomplete + map UI for org/client addresses.

ENV VARS
Supabase:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions)

Stripe:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID_STARTER`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_ENTERPRISE`

Resend:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Twilio (wired but disabled):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `ENABLE_SMS=false`

PostHog:
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`

Google Maps:
- `VITE_GOOGLE_MAPS_API_KEY`

MIGRATION / SEEDING
- Create SQL migrations (e.g. `supabase/migrations/*`).
- Seed from `src/modules/database/seed/seed.ts` in dev only.
- Provide rollback notes in README.

ACCEPTANCE CRITERIA
- Auth flows work (email + magic link).
- Tenant‑isolated data with enforced RLS.
- Image uploads with signed URLs.
- Stripe subscriptions + webhook idempotency + customer portal.
- Email reminders sent; Twilio present but disabled.
- Maps autocomplete + map display works.
- PostHog events for key flows.
- Rate‑limit/captcha guard for public booking is documented/implemented (configurable).

DELIVERABLES
- All code changes in this repo.
- Migrations and RLS policies.
- Edge Functions code.
- Updated docs (README or new `supabase/README.md`) describing setup, env vars, and migration flow.

When implementing, keep UI behavior the same; only replace data/auth/providers. Explain any assumptions you make.
```
