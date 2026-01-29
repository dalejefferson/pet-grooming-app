# Implementation Plan

## Overview

**Sit Pretty Club** is currently a React 19 single-page application using localStorage for all data persistence, mock authentication, and placeholder payment integration. This plan defines a phased migration to a production-ready, full-stack SaaS platform powered by **Supabase** (auth, database, storage, edge functions), deployed on **Vercel**, with integrations for **Stripe** (payments), **Twilio** (SMS), **Resend** (email), **PostHog** (analytics), and **Google Maps** (location services).

The migration is designed to be incremental -- each phase builds on the last, and existing React Query hook interfaces (`useClients`, `usePets`, `useCalendar`, etc.) will be preserved so the UI layer requires minimal changes.

---

## Architecture Vision

### Current Architecture

```
+-----------------------------+
|   React 19 SPA (Vite)       |
|   TailwindCSS 4.1           |
|   React Router DOM v7       |
|   React Query v5            |
+-----------------------------+
          |
          v
+-----------------------------+
|   localStorage              |
|   (JSON key-value store)    |
|   - pet_grooming_clients    |
|   - pet_grooming_pets       |
|   - pet_grooming_services   |
|   - pet_grooming_*          |
+-----------------------------+
          |
          v
+-----------------------------+
|   Seed Data (in-memory)     |
|   src/modules/database/     |
|   seed/seed.ts              |
+-----------------------------+
```

- **Auth**: Mock login via email lookup in localStorage (no password verification)
- **Storage**: Base64 data URLs for pet photos and documents
- **API Layer**: `src/modules/database/api/*.ts` -- all read/write via `getFromStorage` / `setToStorage`
- **Hooks**: `src/modules/database/hooks/*.ts` -- React Query wrappers around localStorage API
- **Types**: `src/modules/database/types/index.ts` and `src/modules/auth/types/index.ts`

### Target Architecture

```
+------------------------------------------------------------------+
|                          Vercel (Hosting)                         |
|  +------------------------------------------------------------+  |
|  |  React 19 SPA                                               |  |
|  |  - React Router DOM v7                                      |  |
|  |  - React Query v5                                           |  |
|  |  - Stripe Elements / React Stripe                           |  |
|  |  - PostHog React SDK                                        |  |
|  |  - Google Maps React API                                    |  |
|  +-----+----------+----------+-----------+----------+----------+  |
|        |          |          |           |          |             |
|  +-----v----+ +---v----+ +--v-----+ +---v----+ +---v------+     |
|  | Supabase | | Stripe | | Twilio | | Resend | | PostHog  |     |
|  | Auth     | | JS SDK | | (via   | | (via   | | JS SDK   |     |
|  | Client   | |        | | Edge   | | Edge   | |          |     |
|  +-----+----+ +---+----+ | Func)  | | Func)  | +----------+     |
|        |          |       +---+----+ +---+----+                  |
|  +-----v----------v----------v----------v---------+              |
|  |        Vercel Serverless / Edge Functions       |              |
|  |  - Stripe Webhook Handler                       |              |
|  |  - Twilio Webhook Handler                       |              |
|  |  - Resend Webhook Handler                       |              |
|  +-----+------------------------------------------+              |
|        |                                                         |
+------------------------------------------------------------------+
         |
+--------v---------------------------------------------------------+
|                     Supabase (Backend)                            |
|  +------------------+  +------------------+  +-----------------+ |
|  | PostgreSQL DB    |  | Supabase Auth    |  | Storage Buckets | |
|  | - organizations  |  | - Email/Password |  | - pet-photos    | |
|  | - clients        |  | - Google OAuth   |  | - documents     | |
|  | - pets           |  | - Magic Links    |  | - avatars       | |
|  | - services       |  +------------------+  +-----------------+ |
|  | - appointments   |                                            |
|  | - groomers       |  +------------------+                      |
|  | - policies       |  | Edge Functions   |                      |
|  | - reminders      |  | - SMS send       |                      |
|  | - vaccinations   |  | - Email send     |                      |
|  | - payment_methods|  | - Stripe charge  |                      |
|  | - staff_avail    |  | - Cron jobs      |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
         |
+--------v---------------------------------------------------------+
|                    Google Maps Platform                           |
|  - Maps JavaScript API (salon map display)                       |
|  - Places API (address autocomplete)                             |
|  - Geocoding API (address-to-coordinates)                        |
+------------------------------------------------------------------+
```

### Data Flow Summary

1. **Client requests** go to the Vercel-hosted SPA
2. **Auth** is handled by Supabase Auth (JWT tokens)
3. **Database reads/writes** go directly from the React app to Supabase PostgreSQL via `@supabase/supabase-js` client, protected by RLS policies
4. **Sensitive operations** (Stripe charges, Twilio SMS, Resend emails) are routed through Supabase Edge Functions or Vercel serverless functions to protect API secrets
5. **Webhooks** from Stripe/Twilio/Resend hit Vercel API routes, which write results back to Supabase
6. **Analytics** are sent client-side to PostHog via the React SDK

---

## Phase 1: Supabase Foundation

### 1.1 Supabase Project Setup

**Objective**: Create a Supabase project and configure environment.

**Steps**:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Record the project URL and anon key
3. Create a `.env.local` file (not committed) with:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...  # Server-side only, never exposed to client
   ```
4. Update `.env.example` with placeholder values for all new env vars
5. Install Supabase CLI for local development:
   ```bash
   npm install -D supabase
   npx supabase init
   npx supabase link --project-ref <project-id>
   ```
6. Replace placeholder client at `src/lib/supabase/client.ts` with real Supabase client:
   ```ts
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from './types'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
   ```

**Deliverables**: Working Supabase project, CLI linked, typed client initialized.

---

### 1.2 Authentication

**Objective**: Replace mock auth (`src/modules/auth/api/authApi.ts`) with Supabase Auth.

**Current State**:
- `authApi.login()` looks up users by email in localStorage, no password check
- `authApi.getCurrentUser()` reads from localStorage
- `useCurrentUser()`, `useLogin()`, `useLogout()` hooks wrap mock API
- `User` type: `{ id, email, name, role, organizationId, avatar?, createdAt }`
- `LoginPage.tsx` has a form with email/password fields
- Role-based permissions via `ROLE_PERMISSIONS` and `usePermissions()` / `PermissionGate` component

**Implementation**:

1. **Supabase Auth Configuration**:
   - Enable email/password provider in Supabase dashboard
   - Enable Google OAuth provider (configure in Google Cloud Console)
   - Enable magic link authentication
   - Configure email templates (confirmation, password reset, magic link)
   - Set redirect URLs for OAuth callbacks

2. **Database: `profiles` table** (extends Supabase `auth.users`):
   ```sql
   CREATE TABLE public.profiles (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     organization_id UUID REFERENCES public.organizations(id),
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'groomer', 'receptionist')),
     avatar_url TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Auto-create profile on signup
   CREATE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, name, role)
     VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'admin');
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. **RLS Policies for profiles**:
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

   -- Users can read profiles in their organization
   CREATE POLICY "Users can view org profiles"
     ON public.profiles FOR SELECT
     USING (
       organization_id = (
         SELECT organization_id FROM public.profiles WHERE id = auth.uid()
       )
     );

   -- Users can update their own profile
   CREATE POLICY "Users can update own profile"
     ON public.profiles FOR UPDATE
     USING (id = auth.uid());
   ```

4. **Refactor `authApi.ts`**:
   ```ts
   import { supabase } from '@/lib/supabase/client'

   export const authApi = {
     async login(email: string, password: string) {
       const { data, error } = await supabase.auth.signInWithPassword({ email, password })
       if (error) throw error
       return data.user
     },

     async loginWithGoogle() {
       const { error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: { redirectTo: `${window.location.origin}/app/dashboard` }
       })
       if (error) throw error
     },

     async loginWithMagicLink(email: string) {
       const { error } = await supabase.auth.signInWithOtp({ email })
       if (error) throw error
     },

     async logout() {
       const { error } = await supabase.auth.signOut()
       if (error) throw error
     },

     async getCurrentUser() {
       const { data: { user } } = await supabase.auth.getUser()
       if (!user) return null
       const { data: profile } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', user.id)
         .single()
       return profile ? { ...profile, email: user.email } : null
     },
   }
   ```

5. **Update `LoginPage.tsx`**:
   - Add Google OAuth button
   - Add magic link option
   - Add password reset flow
   - Add signup flow for new salon owners

6. **Multi-tenant Organization Model**:
   - Every data table includes `organization_id`
   - RLS policies filter by the current user's `organization_id`
   - New salon owners create an organization on first signup
   - Staff members are invited by org admins via email

7. **Auth State Listener**:
   ```ts
   // In App.tsx or a dedicated AuthProvider
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         queryClient.invalidateQueries({ queryKey: ['currentUser'] })
       }
     )
     return () => subscription.unsubscribe()
   }, [])
   ```

**Packages**:
- `@supabase/supabase-js` (client SDK)
- `@supabase/ssr` (server-side auth helpers for Vercel edge functions)

---

### 1.3 Database Migration

**Objective**: Design PostgreSQL schema matching all existing TypeScript types and migrate seed data.

**Current localStorage keys** (from `src/modules/database/storage/localStorage.ts`):
- `pet_grooming_organization`
- `pet_grooming_clients`
- `pet_grooming_pets`
- `pet_grooming_services`
- `pet_grooming_appointments`
- `pet_grooming_policies`
- `pet_grooming_reminders`
- `pet_grooming_groomers`
- `pet_grooming_deleted_items`
- `pet_grooming_payment_methods`
- `pet_grooming_vaccination_reminder_settings`
- `pet_grooming_vaccination_reminders`
- `pet_grooming_notifications`
- `pet_grooming_staff_availability`
- `pet_grooming_time_off_requests`

**PostgreSQL Schema**:

```sql
-- ============================================
-- Organizations
-- ============================================
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  latitude DOUBLE PRECISION,       -- Phase 7: Google Maps
  longitude DOUBLE PRECISION,      -- Phase 7: Google Maps
  stripe_customer_id TEXT,         -- Phase 3: Stripe subscription
  stripe_subscription_id TEXT,     -- Phase 3: Stripe subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  twilio_phone_number TEXT,        -- Phase 4: Twilio
  posthog_distinct_id TEXT,        -- Phase 6: PostHog
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clients
-- ============================================
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  image_url TEXT,
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
  is_new_client BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{}',
  stripe_customer_id TEXT,         -- Phase 3: Stripe
  sms_opt_in BOOLEAN DEFAULT false, -- Phase 4: Twilio compliance
  email_opt_in BOOLEAN DEFAULT true, -- Phase 5: Resend compliance
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_org ON public.clients(organization_id);
CREATE INDEX idx_clients_email ON public.clients(email);

-- ============================================
-- Pets
-- ============================================
CREATE TABLE public.pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other')),
  breed TEXT,
  weight NUMERIC,
  weight_range TEXT CHECK (weight_range IN ('small', 'medium', 'large', 'xlarge')),
  coat_type TEXT CHECK (coat_type IN ('short', 'medium', 'long', 'curly', 'double', 'wire')),
  birth_date DATE,
  behavior_level INTEGER DEFAULT 1 CHECK (behavior_level BETWEEN 1 AND 5),
  grooming_notes TEXT,
  medical_notes TEXT,
  image_url TEXT,
  last_grooming_date DATE,
  preferred_groomer_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pets_client ON public.pets(client_id);
CREATE INDEX idx_pets_org ON public.pets(organization_id);

-- ============================================
-- Vaccination Records
-- ============================================
CREATE TABLE public.vaccination_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date_administered DATE NOT NULL,
  expiration_date DATE NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vaccinations_pet ON public.vaccination_records(pet_id);
CREATE INDEX idx_vaccinations_expiration ON public.vaccination_records(expiration_date);

-- ============================================
-- Services
-- ============================================
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_duration_minutes INTEGER NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  category TEXT CHECK (category IN ('bath', 'haircut', 'nail', 'specialty', 'package')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_services_org ON public.services(organization_id);

-- ============================================
-- Service Modifiers
-- ============================================
CREATE TABLE public.service_modifiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('weight', 'coat', 'breed', 'addon')),
  condition JSONB DEFAULT '{}',
  duration_minutes INTEGER DEFAULT 0,
  price_adjustment NUMERIC(10,2) DEFAULT 0,
  is_percentage BOOLEAN DEFAULT false
);

CREATE INDEX idx_modifiers_service ON public.service_modifiers(service_id);

-- ============================================
-- Groomers / Staff
-- ============================================
CREATE TABLE public.groomers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialties TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'groomer' CHECK (role IN ('admin', 'groomer', 'receptionist')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_groomers_org ON public.groomers(organization_id);
CREATE INDEX idx_groomers_user ON public.groomers(user_id);

-- ============================================
-- Staff Availability
-- ============================================
CREATE TABLE public.staff_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.groomers(id) ON DELETE CASCADE NOT NULL,
  weekly_schedule JSONB NOT NULL DEFAULT '[]',
  max_appointments_per_day INTEGER DEFAULT 8,
  buffer_minutes_between_appointments INTEGER DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_availability_staff ON public.staff_availability(staff_id);

-- ============================================
-- Time Off Requests
-- ============================================
CREATE TABLE public.time_off_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.groomers(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_timeoff_staff ON public.time_off_requests(staff_id);

-- ============================================
-- Appointments
-- ============================================
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  groomer_id UUID REFERENCES public.groomers(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show'
  )),
  status_notes TEXT,
  internal_notes TEXT,
  client_notes TEXT,
  deposit_amount NUMERIC(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  total_amount NUMERIC(10,2) NOT NULL,
  tip_amount NUMERIC(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  paid_at TIMESTAMPTZ,
  transaction_id TEXT,
  stripe_payment_intent_id TEXT,    -- Phase 3: Stripe
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_groomer ON public.appointments(groomer_id);
CREATE INDEX idx_appointments_start ON public.appointments(start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============================================
-- Appointment Pets (junction table)
-- ============================================
CREATE TABLE public.appointment_pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) NOT NULL
);

CREATE INDEX idx_appt_pets_appointment ON public.appointment_pets(appointment_id);

-- ============================================
-- Appointment Pet Services (junction table)
-- ============================================
CREATE TABLE public.appointment_pet_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_pet_id UUID REFERENCES public.appointment_pets(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  applied_modifiers TEXT[] DEFAULT '{}',
  final_duration INTEGER NOT NULL,
  final_price NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_appt_services_pet ON public.appointment_pet_services(appointment_pet_id);

-- ============================================
-- Booking Policies
-- ============================================
CREATE TABLE public.booking_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  new_client_mode TEXT DEFAULT 'request_only' CHECK (new_client_mode IN ('auto_confirm', 'request_only', 'blocked')),
  existing_client_mode TEXT DEFAULT 'auto_confirm' CHECK (existing_client_mode IN ('auto_confirm', 'request_only')),
  deposit_required BOOLEAN DEFAULT true,
  deposit_percentage NUMERIC(5,2) DEFAULT 25,
  deposit_minimum NUMERIC(10,2) DEFAULT 15,
  no_show_fee_percentage NUMERIC(5,2) DEFAULT 50,
  cancellation_window_hours INTEGER DEFAULT 24,
  late_cancellation_fee_percentage NUMERIC(5,2) DEFAULT 50,
  max_pets_per_appointment INTEGER DEFAULT 3,
  min_advance_booking_hours INTEGER DEFAULT 24,
  max_advance_booking_days INTEGER DEFAULT 60,
  policy_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Reminder Schedules
-- ============================================
CREATE TABLE public.reminder_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  appointment_reminders JSONB DEFAULT '{}',
  due_for_grooming JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Payment Methods
-- ============================================
CREATE TABLE public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'card',
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'discover', 'unknown')),
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  stripe_payment_method_id TEXT,    -- Phase 3: Stripe
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payment_methods_client ON public.payment_methods(client_id);

-- ============================================
-- Vaccination Reminder Settings
-- ============================================
CREATE TABLE public.vaccination_reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  reminder_days INTEGER[] DEFAULT '{30, 7}',
  channels JSONB DEFAULT '{"inApp": true, "email": true, "sms": false}',
  block_booking_on_expired BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Vaccination Reminders (sent notifications)
-- ============================================
CREATE TABLE public.vaccination_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  vaccination_id UUID REFERENCES public.vaccination_records(id) ON DELETE CASCADE NOT NULL,
  vaccination_name TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  reminder_type TEXT CHECK (reminder_type IN ('30_day', '7_day', 'expired')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  channels TEXT[] DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- In-App Notifications
-- ============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vaccination_expiring', 'vaccination_expired', 'appointment_reminder', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  pet_id UUID REFERENCES public.pets(id),
  client_id UUID REFERENCES public.clients(id),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_org ON public.notifications(organization_id);

-- ============================================
-- Deleted Items (soft-delete history)
-- ============================================
CREATE TABLE public.deleted_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'pet', 'groomer', 'service')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Feature Flags (org-level)
-- ============================================
CREATE TABLE public.feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  multi_staff_scheduling BOOLEAN DEFAULT false,
  online_payments BOOLEAN DEFAULT false,
  sms_reminders BOOLEAN DEFAULT false,
  email_reminders BOOLEAN DEFAULT false,
  client_portal BOOLEAN DEFAULT false,
  pet_photos BOOLEAN DEFAULT true,
  inventory_management BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Updated_at trigger for all tables
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.groomers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS Policies (applied to every table)**:

```sql
-- Template: all tables with organization_id get this pattern
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation"
  ON public.clients
  FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Repeat for: pets, services, groomers, appointments, booking_policies,
-- reminder_schedules, vaccination_reminder_settings, notifications,
-- feature_flags, staff_availability (via groomers), time_off_requests (via groomers)
```

**Migration Strategy from localStorage**:

1. Build an admin-only "Export Data" function that serializes all localStorage data to JSON
2. Build a one-time "Import to Supabase" edge function that:
   - Creates the organization
   - Maps old string IDs to new UUIDs
   - Inserts all records with proper foreign keys
3. Add a feature flag: `USE_SUPABASE_BACKEND` that toggles between localStorage and Supabase API layers
4. During transition, both API layers coexist -- new hooks check the flag and delegate to the appropriate backend

---

### 1.4 Storage Buckets

**Objective**: Replace base64 data URL storage with Supabase Storage.

**Buckets to Create**:

| Bucket | Access | Purpose |
|--------|--------|---------|
| `pet-photos` | Public | Pet profile images |
| `avatars` | Public | Staff/client profile photos |
| `vaccination-docs` | Private (authenticated) | Vaccination certificates, vet records |
| `org-assets` | Public | Organization logos, booking page branding |

**Bucket Policies**:

```sql
-- pet-photos: public read, authenticated write within org
CREATE POLICY "Public read pet photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

CREATE POLICY "Org members can upload pet photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- vaccination-docs: private, org members only
CREATE POLICY "Org members can access vaccination docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vaccination-docs'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
```

**File Organization**:

```
pet-photos/
  {org_id}/
    {pet_id}/
      profile.jpg
      gallery-{timestamp}.jpg

avatars/
  {org_id}/
    {user_id}.jpg

vaccination-docs/
  {org_id}/
    {pet_id}/
      {vaccination_id}.pdf

org-assets/
  {org_id}/
    logo.png
    booking-banner.jpg
```

**Migration**: A one-time script to:
1. Find all base64 `imageUrl` and `documentUrl` fields in localStorage data
2. Decode base64 to binary
3. Upload to the appropriate Supabase bucket
4. Update database records with the new Supabase storage URLs

---

### 1.5 API Layer Refactor

**Objective**: Replace localStorage calls with Supabase client queries while preserving React Query hook interfaces.

**Current API pattern** (example from `clientsApi.ts`):

```ts
// Current: localStorage
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'

export const clientsApi = {
  async getAll(organizationId?: string): Promise<Client[]> {
    await delay()
    const clients = getFromStorage<Client[]>('clients', seedClients)
    return organizationId ? clients.filter(c => c.organizationId === organizationId) : clients
  },
  // ...
}
```

**Target API pattern**:

```ts
// Target: Supabase
import { supabase } from '@/lib/supabase/client'
import type { Client } from '../types'

export const clientsApi = {
  async getAll(organizationId?: string): Promise<Client[]> {
    let query = supabase.from('clients').select('*')
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data.map(mapDbClientToClient) // Transform snake_case to camelCase
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data ? mapDbClientToClient(data) : null
  },

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const { data: created, error } = await supabase
      .from('clients')
      .insert(mapClientToDb(data))
      .select()
      .single()
    if (error) throw error
    return mapDbClientToClient(created)
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const { data: updated, error } = await supabase
      .from('clients')
      .update(mapClientToDb(data))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapDbClientToClient(updated)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}
```

**API files to refactor** (14 total):

| File | Description |
|------|-------------|
| `orgApi.ts` | Organization CRUD |
| `clientsApi.ts` | Client CRUD + search |
| `petsApi.ts` | Pet CRUD + vaccinations |
| `servicesApi.ts` | Service + modifier CRUD |
| `calendarApi.ts` | Appointment queries for calendar views |
| `bookingApi.ts` | Booking flow operations |
| `policiesApi.ts` | Booking policies CRUD |
| `remindersApi.ts` | Reminder schedule CRUD |
| `groomersApi.ts` | Groomer/staff CRUD |
| `historyApi.ts` | Deleted items history |
| `paymentMethodsApi.ts` | Payment method CRUD |
| `vaccinationRemindersApi.ts` | Vaccination reminder logic |
| `staffApi.ts` | Staff availability + time off |
| `performanceApi.ts` | Performance metrics queries |

**Hooks remain unchanged** (14 hook files):
- `useOrganization`, `useClients`, `usePets`, `useServices`, `useCalendar`, `useBooking`, `usePolicies`, `useReminders`, `useGroomers`, `useHistory`, `usePaymentMethods`, `useVaccinationReminders`, `useStaff`, `usePerformance`

**Key Strategy**:
- Create `src/modules/database/utils/mappers.ts` for camelCase-to-snake_case field mapping
- Generate Supabase TypeScript types: `npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`
- The React Query hooks in `src/modules/database/hooks/` remain untouched -- only the API layer under `src/modules/database/api/` changes
- Add Supabase real-time subscriptions for appointments (optional, for multi-user calendar sync):
  ```ts
  supabase.channel('appointments').on('postgres_changes',
    { event: '*', schema: 'public', table: 'appointments' },
    () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
  ).subscribe()
  ```

---

## Phase 2: Vercel Deployment

### 2.1 Vercel Setup

**Objective**: Deploy the SPA to Vercel with environment variable management.

**Steps**:

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: Vite
3. Configure environment variables in Vercel dashboard (see [Environment Variables Summary](#environment-variables-summary)):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_POSTHOG_KEY`
   - `VITE_POSTHOG_HOST`
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_APP_URL`
4. Configure preview deployments:
   - Auto-deploy preview for every PR
   - Each preview gets unique URL for QA
   - Preview deployments use separate Supabase branch databases (optional)
5. Custom domain setup:
   - `app.sitprettyclub.com` -- main app
   - `book.sitprettyclub.com` -- public booking portal (or subdirectory)
6. Configure SPA routing:
   ```json
   // vercel.json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

### 2.2 Edge Functions / API Routes

**Objective**: Create serverless functions for webhook handling and server-side API calls.

**Directory structure**:

```
api/
├── webhooks/
│   ├── stripe.ts          # Stripe webhook handler
│   ├── twilio.ts          # Twilio webhook handler (inbound SMS)
│   └── resend.ts          # Resend webhook handler (email events)
├── stripe/
│   ├── create-checkout-session.ts
│   ├── create-payment-intent.ts
│   ├── create-customer.ts
│   └── create-portal-session.ts
├── twilio/
│   ├── send-sms.ts
│   └── provision-number.ts
├── resend/
│   ├── send-email.ts
│   └── send-batch.ts
└── cron/
    ├── send-reminders.ts    # Daily reminder check
    └── vaccination-check.ts # Daily vaccination expiration check
```

**Example webhook handler (Stripe)**:

```ts
// api/webhooks/stripe.ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object)
      break
  }

  return new Response('ok', { status: 200 })
}
```

**Vercel Cron Jobs** (for scheduled tasks):

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/vaccination-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## Phase 3: Stripe Integration

### 3.1 Payment Processing

**Objective**: Enable real payment processing for grooming services.

**Current State**:
- `PaymentMethod` type exists with mock card data (brand, last4, expMonth, expYear)
- `paymentMethodsApi.ts` stores card stubs in localStorage
- Appointments track `totalAmount`, `tipAmount`, `paymentStatus`, `transactionId`
- `BookingPolicies` defines deposit percentages and no-show fees
- `.env.example` has `VITE_STRIPE_PUBLISHABLE_KEY` placeholder

**Implementation**:

1. **Stripe Customer Creation**:
   - When a client is created in the app, create a corresponding Stripe Customer
   - Store `stripe_customer_id` in the `clients` table
   - Edge function: `POST /api/stripe/create-customer`

2. **Stripe Elements Integration**:
   ```tsx
   // BookingConfirmPage.tsx - Add card collection
   import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
   import { loadStripe } from '@stripe/stripe-js'

   const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

   function PaymentForm({ clientSecret }: { clientSecret: string }) {
     const stripe = useStripe()
     const elements = useElements()

     const handleSubmit = async () => {
       const { error, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
         payment_method: { card: elements!.getElement(CardElement)! }
       })
       // Handle result
     }
   }
   ```

3. **Payment Intent Flow**:
   - Client selects services in booking flow
   - Server creates PaymentIntent with the total amount
   - Client confirms payment via Stripe Elements
   - Webhook confirms successful charge and updates appointment `payment_status`

4. **Save Card for Future Use**:
   - During booking, option to save card via Stripe SetupIntent
   - Stored as Stripe PaymentMethod attached to Stripe Customer
   - Display saved cards using the existing `PaymentMethod` UI

5. **Stripe Customer Portal**:
   - Edge function creates a portal session
   - Clients can manage their saved payment methods

**Packages**:
- `@stripe/stripe-js` (client-side Stripe.js loader)
- `@stripe/react-stripe-js` (React components)
- `stripe` (server-side Node.js SDK, used in API routes / edge functions)

---

### 3.2 Subscription Billing (SaaS)

**Objective**: Monetize the platform with subscription tiers for salon owners.

**Pricing Tiers**:

| Tier | Price/month | Limits |
|------|-------------|--------|
| **Free** | $0 | 1 groomer, 25 clients, no SMS/email |
| **Starter** | $29/month | 3 groomers, unlimited clients, email only |
| **Professional** | $79/month | 10 groomers, SMS + email, reports, analytics |
| **Enterprise** | $149/month | Unlimited groomers, priority support, custom branding |

**Implementation**:

1. Create Stripe Products and Prices for each tier
2. **Stripe Checkout** for subscription signup:
   ```ts
   // api/stripe/create-checkout-session.ts
   const session = await stripe.checkout.sessions.create({
     mode: 'subscription',
     customer: stripeCustomerId,
     line_items: [{ price: stripePriceId, quantity: 1 }],
     success_url: `${process.env.VITE_APP_URL}/app/settings?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${process.env.VITE_APP_URL}/app/settings`,
   })
   ```
3. Webhook handlers for:
   - `checkout.session.completed` -- activate subscription
   - `customer.subscription.updated` -- handle plan changes
   - `customer.subscription.deleted` -- downgrade to free
   - `invoice.payment_failed` -- notify admin, grace period

4. **Metered billing** considerations:
   - Track SMS count per billing period
   - Additional charges for exceeding SMS limits
   - Usage reported to Stripe via Meter Events API

---

### 3.3 No-Show Charges

**Objective**: Implement automated no-show fee collection.

**Current State**: `BookingPolicies.noShowFeePercentage` exists (default 50%).

**Implementation**:

1. When an appointment is marked as `no_show`:
   - Calculate fee: `appointment.totalAmount * (policies.noShowFeePercentage / 100)`
   - Charge the client's saved card via Stripe PaymentIntent (off-session)
   - If no saved card, send invoice via Resend (Phase 5)
2. Edge function: `charge-no-show`:
   ```ts
   const paymentIntent = await stripe.paymentIntents.create({
     amount: feeAmount * 100, // cents
     currency: 'usd',
     customer: client.stripe_customer_id,
     payment_method: defaultPaymentMethod.stripe_payment_method_id,
     off_session: true,
     confirm: true,
     description: `No-show fee for ${petName} appointment on ${date}`,
   })
   ```
3. Record the charge in the appointment's `payment_status` and `transaction_id`
4. Send notification to client (via Resend email and/or Twilio SMS)

---

### 3.4 Invoicing

**Objective**: Generate and send invoices for completed services.

**Implementation**:

1. On appointment completion, generate invoice data:
   - Service line items with prices
   - Applied modifiers
   - Tips
   - Deposit already paid
   - Balance due
2. Create Stripe Invoice (optional, for record-keeping):
   ```ts
   const invoice = await stripe.invoices.create({
     customer: client.stripe_customer_id,
     auto_advance: true, // auto-finalize
   })
   ```
3. Email receipt via Resend (Phase 5)
4. Integrate with existing PDF export (`src/lib/utils/reportPdfExport.ts`) for downloadable invoices

---

## Phase 4: Twilio Integration

### 4.1 SMS Notifications

**Objective**: Send automated SMS for appointment lifecycle events.

**Current State**:
- `ReminderSchedule` type has templates with `{{placeholders}}`
- Templates exist for 48h, 24h, 2h reminders
- `due_for_grooming` reminder template exists
- `NotificationChannel` type includes `'sms'`

**Implementation**:

1. **Twilio Account Setup**:
   - Create Twilio account, purchase phone number
   - Configure Messaging Service for high-volume sending
   - Set up A2P 10DLC registration for compliance (US requirement)

2. **Supabase Edge Function for sending SMS**:
   ```ts
   // supabase/functions/send-sms/index.ts
   import { Twilio } from 'twilio'

   const client = new Twilio(
     Deno.env.get('TWILIO_ACCOUNT_SID')!,
     Deno.env.get('TWILIO_AUTH_TOKEN')!
   )

   Deno.serve(async (req) => {
     const { to, body, fromNumber } = await req.json()

     const message = await client.messages.create({
       to,
       from: fromNumber || Deno.env.get('TWILIO_DEFAULT_NUMBER')!,
       body,
     })

     return new Response(JSON.stringify({ sid: message.sid }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

3. **Template Rendering**:
   ```ts
   function renderTemplate(template: string, vars: Record<string, string>): string {
     return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
   }
   // Uses existing templates from ReminderSchedule
   ```

4. **Reminder Cron Job** (`api/cron/send-reminders.ts`):
   - Runs daily at 8 AM (configurable per org timezone)
   - Queries appointments for next 48 hours
   - Matches against org's reminder schedule
   - Sends SMS/email via Twilio/Resend
   - Records reminder in `vaccination_reminders` / new `sent_reminders` table

5. **SMS Events**:
   - Booking confirmation
   - Appointment reminder (48h, 24h, 2h)
   - Cancellation notification
   - No-show notification
   - Payment receipt
   - Due-for-grooming nudge

---

### 4.2 Mass Texting

**Objective**: Allow salon owners to send targeted bulk SMS campaigns.

**Implementation**:

1. **New UI**: `src/pages/app/CampaignsPage.tsx`
   - Client segmentation filters:
     - Last visit date range
     - Pet species/breed
     - Service history
     - No-show count
     - Custom tags
   - Template builder with variable injection
   - Preview and send

2. **Database: `sms_campaigns` table**:
   ```sql
   CREATE TABLE public.sms_campaigns (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL,
     template TEXT NOT NULL,
     segment_criteria JSONB NOT NULL,
     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
     scheduled_at TIMESTAMPTZ,
     sent_count INTEGER DEFAULT 0,
     total_recipients INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **Compliance**:
   - SMS opt-in tracking on client records (`sms_opt_in` field)
   - STOP keyword handling via Twilio webhook
   - Opt-out link in every campaign message
   - Rate limiting: max 1 SMS per second per number, max 1 campaign per client per day

---

### 4.3 Personal Phone Numbers

**Objective**: Provision dedicated phone numbers per salon.

**Implementation**:

1. **Number Provisioning**:
   - Admin purchases a number from Twilio via in-app UI
   - Number stored in `organizations.twilio_phone_number`
   - All outbound SMS from that org uses their dedicated number

2. **Inbound SMS Routing**:
   - Twilio webhook (`POST /api/webhooks/twilio`) receives inbound messages
   - Route to the correct organization based on the `To` number
   - Store in a `sms_conversations` table
   - Display in-app inbox for staff

3. **Call Forwarding**:
   - Configure TwiML to forward calls from the Twilio number to the salon's actual phone
   - Business hours routing (forward to voicemail outside hours)

---

## Phase 5: Resend Integration

### 5.1 Transactional Email

**Objective**: Send automated emails for business operations.

**Implementation**:

1. **Resend Setup**:
   - Create Resend account
   - Verify sending domain (e.g., `mail.sitprettyclub.com`)
   - Configure DNS records (SPF, DKIM, DMARC)

2. **Email Templates** (using React Email):
   ```
   src/emails/
   ├── BookingConfirmation.tsx
   ├── AppointmentReminder.tsx
   ├── CancellationNotice.tsx
   ├── NoShowNotice.tsx
   ├── InvoiceReceipt.tsx
   ├── PasswordReset.tsx
   ├── WelcomeEmail.tsx
   ├── VaccinationReminder.tsx
   └── DueForGrooming.tsx
   ```

3. **Supabase Edge Function for sending email**:
   ```ts
   // supabase/functions/send-email/index.ts
   import { Resend } from 'resend'

   const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

   Deno.serve(async (req) => {
     const { to, subject, html, from } = await req.json()

     const { data, error } = await resend.emails.send({
       from: from || 'Sit Pretty Club <noreply@sitprettyclub.com>',
       to,
       subject,
       html,
     })

     return new Response(JSON.stringify(data), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

4. **Email Triggers**:
   - Booking confirmed/requested
   - Appointment reminder (48h, 24h)
   - Cancellation confirmation
   - No-show notification with fee details
   - Invoice/receipt after payment
   - Password reset (supplement Supabase Auth emails)
   - Welcome email for new clients
   - Vaccination expiration warning

**Packages**:
- `resend` (API SDK, server-side only)
- `@react-email/components` (email template components)

---

### 5.2 Marketing Email

**Objective**: Enable promotional email campaigns.

**Implementation**:

1. **New database tables**:
   ```sql
   CREATE TABLE public.email_campaigns (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL,
     subject TEXT NOT NULL,
     html_content TEXT NOT NULL,
     segment_criteria JSONB,
     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
     scheduled_at TIMESTAMPTZ,
     sent_count INTEGER DEFAULT 0,
     open_count INTEGER DEFAULT 0,
     click_count INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **Unsubscribe Management**:
   - One-click unsubscribe link in every marketing email
   - `email_opt_in` field on clients table
   - Resend webhook for bounce/complaint handling
   - Comply with CAN-SPAM / GDPR requirements

3. **Template Builder UI**:
   - Drag-and-drop email builder (future phase)
   - Initial version: Markdown editor with preview
   - Pre-built templates for common scenarios (holiday specials, seasonal promotions)

---

## Phase 6: PostHog Integration

### 6.1 Product Analytics

**Objective**: Track user behavior and feature usage.

**Implementation**:

1. **PostHog Setup**:
   ```tsx
   // src/main.tsx or App.tsx
   import posthog from 'posthog-js'
   import { PostHogProvider } from 'posthog-js/react'

   posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
     api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
     person_profiles: 'identified_only',
     capture_pageview: true,
     capture_pageleave: true,
   })

   // In App component:
   <PostHogProvider client={posthog}>
     <ThemeProvider>
       {/* ... */}
     </ThemeProvider>
   </PostHogProvider>
   ```

2. **User Identification**:
   ```ts
   // After login
   posthog.identify(user.id, {
     email: user.email,
     name: user.name,
     role: user.role,
     organization_id: user.organizationId,
     subscription_tier: org.subscriptionTier,
   })

   // After logout
   posthog.reset()
   ```

3. **Custom Events to Track**:

   | Event | Properties | Purpose |
   |-------|-----------|---------|
   | `appointment_created` | service_names, total_amount, pet_count | Booking volume |
   | `appointment_completed` | duration_minutes, tip_amount | Service metrics |
   | `appointment_cancelled` | reason, advance_hours | Cancellation analysis |
   | `appointment_no_show` | fee_charged | No-show rate |
   | `booking_flow_started` | is_new_client | Funnel entry |
   | `booking_flow_completed` | total_amount, services_count | Funnel completion |
   | `booking_flow_abandoned` | step, reason | Drop-off analysis |
   | `client_created` | source | Acquisition |
   | `payment_processed` | amount, method | Revenue tracking |
   | `sms_sent` | type (reminder, campaign) | Communication metrics |
   | `email_sent` | type, opened | Email engagement |
   | `feature_used` | feature_name | Feature adoption |
   | `report_exported` | format (pdf, csv), report_type | Reporting usage |

4. **Funnel Analysis** -- Booking flow:
   - Step 1: Start page view
   - Step 2: Pet selection
   - Step 3: Groomer selection
   - Step 4: Service/intake
   - Step 5: Time selection
   - Step 6: Confirmation
   - Step 7: Success

**Packages**:
- `posthog-js` (JavaScript SDK)

---

### 6.2 Feature Flags

**Objective**: Control feature rollout and run experiments.

**Implementation**:

1. **PostHog Feature Flags** (replaces local `FeatureFlags` type):
   ```ts
   // Replace src/modules/database/types FeatureFlags
   import { useFeatureFlagEnabled } from 'posthog-js/react'

   function MyComponent() {
     const showOnlinePayments = useFeatureFlagEnabled('online_payments')
     const showSmsReminders = useFeatureFlagEnabled('sms_reminders')

     if (!showOnlinePayments) return null
     return <PaymentSection />
   }
   ```

2. **Flags to Create**:

   | Flag | Purpose | Default |
   |------|---------|---------|
   | `online_payments` | Enable Stripe payment collection | Off |
   | `sms_reminders` | Enable Twilio SMS | Off |
   | `email_reminders` | Enable Resend email | Off |
   | `mass_texting` | Enable campaign SMS | Off |
   | `google_maps` | Enable location features | Off |
   | `new_booking_flow` | A/B test new booking UI | 50% |
   | `ai_pet_notes` | AI-generated grooming notes | Off |

3. **A/B Testing**:
   - Test booking flow variants for conversion
   - Test pricing page layouts
   - Test reminder timing (24h vs 48h vs both)

---

### 6.3 Session Recording

**Objective**: Capture user sessions for UX research and debugging.

**Implementation**:

1. **Enable in PostHog config**:
   ```ts
   posthog.init(POSTHOG_KEY, {
     session_recording: {
       maskAllInputs: true,         // Privacy: mask form inputs
       maskTextContent: false,       // Show text content for UX context
       recordCrossOriginIframes: false,
     },
   })
   ```

2. **Privacy Controls**:
   - Mask all input fields by default (client PII)
   - Allow opt-out of session recording
   - Only record admin users (not public booking flow by default)
   - Auto-delete recordings after 30 days

3. **Error Tracking**:
   - PostHog captures JavaScript errors automatically
   - Custom error boundary integration:
     ```ts
     posthog.capture('$exception', {
       $exception_type: error.name,
       $exception_message: error.message,
       $exception_stack_trace_raw: error.stack,
     })
     ```

---

## Phase 7: Google Maps Integration

### 7.1 Location Services

**Objective**: Display salon locations and enable location-based features.

**Implementation**:

1. **Google Cloud Setup**:
   - Enable Maps JavaScript API
   - Enable Places API
   - Enable Geocoding API
   - Create API key with HTTP referrer restrictions
   - Set usage quotas and billing alerts

2. **Salon Map on Booking Page**:
   ```tsx
   import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'

   function SalonMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
     return (
       <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
         <Map
           center={{ lat, lng }}
           zoom={15}
           style={{ width: '100%', height: 300 }}
         >
           <Marker position={{ lat, lng }} title={name} />
         </Map>
       </APIProvider>
     )
   }
   ```

3. **Address Autocomplete** (for client/org addresses):
   ```tsx
   import usePlacesAutocomplete from 'use-places-autocomplete'

   function AddressInput({ onSelect }) {
     const { suggestions, value, setValue } = usePlacesAutocomplete()
     // Render autocomplete dropdown
   }
   ```

4. **Geocoding** (convert address to coordinates):
   - When organization saves address, geocode to lat/lng
   - Store in `organizations.latitude` and `organizations.longitude`

**Packages**:
- `@vis.gl/react-google-maps` (Google Maps React components)
- `use-places-autocomplete` (Places API React hook)

---

### 7.2 Multi-Location Support

**Objective**: Support salon chains with multiple locations.

**Implementation**:

1. **Database Changes**:
   ```sql
   CREATE TABLE public.locations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL,
     address TEXT NOT NULL,
     phone TEXT,
     latitude DOUBLE PRECISION,
     longitude DOUBLE PRECISION,
     timezone TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- All existing tables with organization_id also get location_id
   ALTER TABLE public.appointments ADD COLUMN location_id UUID REFERENCES public.locations(id);
   ALTER TABLE public.groomers ADD COLUMN location_id UUID REFERENCES public.locations(id);
   ```

2. **Booking Flow Enhancement**:
   - Step 0 (new): Select location
   - Show all locations on a map
   - Auto-suggest nearest location based on user's browser geolocation
   - Filter groomers and time slots by selected location

3. **Admin: Location Management**:
   - New page: `src/pages/app/LocationsPage.tsx`
   - CRUD for locations
   - Assign staff to locations
   - Per-location business hours

---

## Environment Variables Summary

| Variable | Service | Description | Client/Server |
|----------|---------|-------------|----------------|
| `VITE_SUPABASE_URL` | Supabase | Project URL | Client |
| `VITE_SUPABASE_ANON_KEY` | Supabase | Public anonymous key | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Service role key (admin access) | Server only |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe | Publishable key for Stripe.js | Client |
| `STRIPE_SECRET_KEY` | Stripe | Secret key for server-side API calls | Server only |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook endpoint signing secret | Server only |
| `TWILIO_ACCOUNT_SID` | Twilio | Account SID | Server only |
| `TWILIO_AUTH_TOKEN` | Twilio | Auth token | Server only |
| `TWILIO_DEFAULT_NUMBER` | Twilio | Default outbound phone number | Server only |
| `TWILIO_WEBHOOK_SECRET` | Twilio | Webhook validation secret | Server only |
| `RESEND_API_KEY` | Resend | API key for sending emails | Server only |
| `RESEND_WEBHOOK_SECRET` | Resend | Webhook signing secret | Server only |
| `VITE_POSTHOG_KEY` | PostHog | Project API key | Client |
| `VITE_POSTHOG_HOST` | PostHog | API host (default: us.i.posthog.com) | Client |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps | Maps JavaScript API key | Client |
| `VITE_APP_URL` | App | Application URL (e.g., https://app.sitprettyclub.com) | Client |
| `VITE_APP_NAME` | App | Application display name | Client |

---

## Package Dependencies Summary

| Package | Purpose | Phase |
|---------|---------|-------|
| `@supabase/supabase-js` | Supabase client SDK (auth, database, storage, realtime) | 1 |
| `@supabase/ssr` | Server-side auth helpers for Vercel functions | 1 |
| `supabase` (devDep) | Supabase CLI for local dev, migrations, type generation | 1 |
| `@stripe/stripe-js` | Client-side Stripe.js loader | 3 |
| `@stripe/react-stripe-js` | React components for Stripe Elements | 3 |
| `stripe` | Server-side Stripe SDK (used in API routes) | 3 |
| `twilio` | Twilio SDK for SMS (server-side / edge functions) | 4 |
| `resend` | Resend SDK for email (server-side / edge functions) | 5 |
| `@react-email/components` | React Email template components | 5 |
| `posthog-js` | PostHog JavaScript SDK (analytics, feature flags, session recording) | 6 |
| `@vis.gl/react-google-maps` | Google Maps React wrapper | 7 |
| `use-places-autocomplete` | Places Autocomplete React hook | 7 |

---

## Migration Strategy

### Step-by-Step Migration from localStorage to Supabase

**Phase A: Dual-Mode Operation (Weeks 1-2)**

1. Add a `VITE_USE_SUPABASE` environment variable (default: `false`)
2. Create adapter layer in `src/modules/database/api/`:
   ```ts
   // src/modules/database/api/clientsApi.ts
   import { clientsLocalApi } from './local/clientsLocalApi'
   import { clientsSupabaseApi } from './supabase/clientsSupabaseApi'

   const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'

   export const clientsApi = useSupabase ? clientsSupabaseApi : clientsLocalApi
   ```
3. Move existing localStorage implementations to `src/modules/database/api/local/`
4. Create new Supabase implementations in `src/modules/database/api/supabase/`
5. Both implement the same interface -- hooks remain unchanged

**Phase B: Data Export (Week 2)**

1. Build admin tool: "Export All Data" button in Settings page
2. Serializes all localStorage data to a downloadable JSON file
3. JSON includes all entities with their relationships

**Phase C: Data Import (Week 3)**

1. Build Supabase Edge Function: `import-data`
2. Accepts the exported JSON
3. Creates UUID mapping from old string IDs to new UUIDs
4. Inserts all records maintaining referential integrity
5. Order of insertion:
   - Organizations
   - Profiles (users)
   - Clients
   - Pets
   - Vaccination Records
   - Services
   - Service Modifiers
   - Groomers
   - Staff Availability
   - Time Off Requests
   - Appointments
   - Appointment Pets
   - Appointment Pet Services
   - Booking Policies
   - Reminder Schedules
   - Payment Methods
   - Vaccination Settings
   - Notifications
   - Deleted Items

**Phase D: Cutover (Week 4)**

1. Flip `VITE_USE_SUPABASE=true` for staging environment
2. Run comprehensive QA on all features
3. Verify RLS policies work correctly
4. Confirm real-time subscriptions function
5. Flip for production
6. Monitor for 1 week
7. Remove localStorage code once stable

### Backward Compatibility

- During transition, the app works fully offline with localStorage (existing behavior)
- Feature flags control which integrations are active
- Supabase can be disabled entirely by not setting env vars
- Seed data remains for development/demo purposes

---

## Risk Assessment

### Phase 1: Supabase Foundation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data loss during migration | Medium | High | Export/backup before migration; keep localStorage as fallback |
| RLS policy misconfiguration exposing data | Medium | Critical | Automated RLS tests; pen-test multi-tenant isolation |
| Schema design requiring breaking changes | Medium | Medium | Use JSONB for flexible fields; plan for migration scripts |
| Cold start latency on Supabase | Low | Low | Connection pooling; React Query caching |
| camelCase-to-snake_case mapping bugs | High | Medium | Comprehensive mapper unit tests; TypeScript generated types |

### Phase 2: Vercel Deployment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SPA routing issues on Vercel | Low | Medium | Configure `vercel.json` rewrites |
| Environment variable leakage | Low | Critical | Strict `VITE_` prefix convention; audit build output |
| Preview deployment using production data | Medium | High | Separate Supabase projects for staging/production |
| Build failures on deploy | Low | Low | CI/CD pipeline with `npm run build` check before deploy |

### Phase 3: Stripe Integration

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PCI compliance exposure | Medium | Critical | Use Stripe Elements (never touch raw card data); annual PCI SAQ-A |
| Payment webhook delivery failures | Medium | High | Implement webhook retry logic; idempotency keys |
| Off-session charge failures (no-show) | High | Medium | Graceful fallback to email invoice; retry with exponential backoff |
| Subscription billing edge cases | Medium | Medium | Comprehensive webhook handling; Stripe test mode for QA |
| Incorrect charge amounts | Low | Critical | Server-side amount calculation; never trust client-sent amounts |

### Phase 4: Twilio Integration

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| A2P 10DLC registration delays | High | High | Start registration early (takes 2-4 weeks); use toll-free as fallback |
| SMS delivery failures | Medium | Medium | Delivery status webhooks; retry logic; fallback to email |
| Compliance violations (TCPA) | Medium | Critical | Strict opt-in/opt-out tracking; legal review of SMS templates |
| High SMS costs at scale | Medium | Medium | Rate limiting; metered billing to pass costs to salon owners |
| Carrier filtering/blocking | Medium | Medium | Follow A2P best practices; use dedicated short codes for high volume |

### Phase 5: Resend Integration

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Email deliverability issues | Medium | High | Proper SPF/DKIM/DMARC setup; monitor sender reputation |
| Email template rendering bugs | Medium | Low | React Email testing; preview in multiple clients |
| Bounce rate affecting sender reputation | Low | Medium | Clean email lists; validate addresses on entry |
| CAN-SPAM/GDPR non-compliance | Low | Critical | Mandatory unsubscribe links; consent tracking |

### Phase 6: PostHog Integration

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Performance impact from tracking | Low | Medium | Async event capture; debounce high-frequency events |
| PII in analytics events | Medium | High | Scrub PII before sending; configure data masking |
| Ad blocker blocking PostHog | High | Low | Self-host PostHog proxy; graceful degradation |
| Session recording privacy concerns | Medium | Medium | Mask all inputs; opt-out mechanism; recording consent banner |

### Phase 7: Google Maps Integration

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google Maps API costs | Medium | Medium | Set billing alerts; cache geocoding results; limit API calls |
| API key exposure | Low | Medium | HTTP referrer restrictions; usage quotas |
| Places API deprecation / changes | Low | Low | Abstract behind interface; monitor Google API changelog |
| Geolocation permission denied | High | Low | Graceful fallback (manual location entry); clear permission prompt copy |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 1: Supabase Foundation | 4-6 weeks | None |
| Phase 2: Vercel Deployment | 1-2 weeks | Phase 1 |
| Phase 3: Stripe Integration | 3-4 weeks | Phase 1, Phase 2 |
| Phase 4: Twilio Integration | 3-4 weeks | Phase 1, Phase 2 |
| Phase 5: Resend Integration | 2-3 weeks | Phase 1, Phase 2 |
| Phase 6: PostHog Integration | 1-2 weeks | Phase 2 |
| Phase 7: Google Maps Integration | 2-3 weeks | Phase 1 |

**Total estimated timeline**: 16-24 weeks (4-6 months)

Phases 3-7 can be partially parallelized after Phase 2 is complete. PostHog (Phase 6) can start immediately after Vercel deployment since it has no backend dependency beyond hosting.

---

## Appendix: Current Codebase Reference

### Existing Module Structure

```
src/modules/
├── auth/
│   ├── api/authApi.ts            # Mock auth (localStorage)
│   ├── hooks/useAuth.ts          # useCurrentUser, useLogin, useLogout
│   ├── hooks/usePermissions.ts   # Role-based permission checks
│   ├── components/PermissionGate.tsx
│   ├── pages/LoginPage.tsx
│   ├── types/index.ts            # User type
│   └── utils/index.ts
├── database/
│   ├── api/                      # 14 API files (localStorage)
│   ├── hooks/                    # 14 React Query hook files
│   ├── seed/seed.ts              # Mock data
│   ├── storage/localStorage.ts   # getFromStorage, setToStorage, generateId
│   ├── config/queryClient.ts     # React Query client
│   └── types/index.ts            # All domain types
└── ui/
    ├── components/               # All UI components
    ├── context/                  # Theme, Keyboard, Undo, ShortcutTips
    └── pages/                    # All page components
```

### Key Files That Change Per Phase

**Phase 1 (Supabase)**:
- `src/lib/supabase/client.ts` -- Replace placeholder with real client
- `src/modules/database/api/*.ts` -- All 14 API files refactored
- `src/modules/auth/api/authApi.ts` -- Replace mock auth
- `src/modules/auth/pages/LoginPage.tsx` -- Add OAuth/magic link

**Phase 2 (Vercel)**:
- New: `vercel.json` -- Routing and cron config
- New: `api/` directory -- Serverless functions

**Phase 3 (Stripe)**:
- `src/modules/database/api/paymentMethodsApi.ts` -- Real Stripe payment methods
- Booking flow pages -- Add Stripe Elements
- New: `api/stripe/` -- Payment endpoints
- New: `api/webhooks/stripe.ts` -- Webhook handler

**Phase 4 (Twilio)**:
- New: `supabase/functions/send-sms/` -- SMS edge function
- New: `src/pages/app/CampaignsPage.tsx` -- Mass texting UI
- New: `api/webhooks/twilio.ts` -- Inbound SMS handler

**Phase 5 (Resend)**:
- New: `src/emails/` -- React Email templates
- New: `supabase/functions/send-email/` -- Email edge function
- New: `api/webhooks/resend.ts` -- Email event handler

**Phase 6 (PostHog)**:
- `src/App.tsx` -- Add PostHogProvider
- Various pages -- Add tracking events
- Replace `FeatureFlags` type with PostHog feature flags

**Phase 7 (Google Maps)**:
- Booking pages -- Add salon map
- Settings page -- Add location management
- New: `src/pages/app/LocationsPage.tsx`
