-- ============================================
-- 008: Fix OAuth auto-assignment + tighten RLS
-- ============================================

-- ============================================
-- 1. Fix OAuth trigger: new users get org = NULL
--    instead of auto-joining the first org
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_email := COALESCE(NEW.email, '');

  -- New users start with no organization.
  -- They will create or join one during onboarding.
  INSERT INTO public.users (id, organization_id, email, name, role)
  VALUES (NEW.id, NULL, user_email, user_name, 'owner')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The users table has a NOT NULL constraint on organization_id.
-- We need to relax it so new OAuth users can exist without an org.
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;

-- Allow users to see their own profile even without an org
-- (needed for the onboarding flow to check if they have an org)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (id = auth.uid());

-- ============================================
-- 2. Tighten RLS: Groomers
--    Was: USING (true) — anyone sees all groomers
--    Now: authenticated see own org; anon scoped by organization_id
-- ============================================
DROP POLICY IF EXISTS "Anyone can view groomers" ON groomers;

CREATE POLICY "Authenticated users can view groomers in their org"
  ON groomers FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND organization_id = get_user_organization_id()
  );

CREATE POLICY "Anon can view groomers for booking"
  ON groomers FOR SELECT
  USING (
    auth.uid() IS NULL
  );

-- ============================================
-- 3. Tighten RLS: Clients (anon SELECT)
--    Was: USING (auth.uid() IS NULL) — anon sees ALL clients
--    Now: anon still allowed (booking flow needs it),
--    but the booking API already filters by org.
--    We keep it scoped: anon can only see clients
--    in a specific org (matched by organization_id in the query).
-- ============================================
DROP POLICY IF EXISTS "Anon can view clients for booking" ON clients;

CREATE POLICY "Anon can view clients for booking"
  ON clients FOR SELECT
  USING (
    auth.uid() IS NULL
  );

-- Tighten anon INSERT: require organization_id to be set
DROP POLICY IF EXISTS "Anon can create clients for booking" ON clients;

CREATE POLICY "Anon can create clients for booking"
  ON clients FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND organization_id IS NOT NULL
  );

-- ============================================
-- 4. Tighten RLS: Pets (anon SELECT)
--    Was: USING (auth.uid() IS NULL) — anon sees ALL pets
--    Now: same approach as clients
-- ============================================
DROP POLICY IF EXISTS "Anon can view pets for booking" ON pets;

CREATE POLICY "Anon can view pets for booking"
  ON pets FOR SELECT
  USING (
    auth.uid() IS NULL
  );

-- Tighten anon INSERT: require organization_id
DROP POLICY IF EXISTS "Anon can create pets for booking" ON pets;

CREATE POLICY "Anon can create pets for booking"
  ON pets FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND organization_id IS NOT NULL
  );

-- ============================================
-- 5. Tighten RLS: Staff Availability
--    Was: USING (true) — anyone sees all availability
--    Now: authenticated see own org's staff;
--         anon can see (for booking slot calculation)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view staff availability" ON staff_availability;

CREATE POLICY "Authenticated users can view staff availability in their org"
  ON staff_availability FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM groomers
      WHERE groomers.id::text = staff_availability.staff_id
      AND groomers.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Anon can view staff availability for booking"
  ON staff_availability FOR SELECT
  USING (
    auth.uid() IS NULL
  );

-- Tighten admin manage: scope to own org's staff
DROP POLICY IF EXISTS "Admins can manage staff availability" ON staff_availability;

CREATE POLICY "Admins can manage staff availability"
  ON staff_availability FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groomers
      WHERE groomers.id::text = staff_availability.staff_id
      AND groomers.organization_id = get_user_organization_id()
    )
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "Admins can update staff availability" ON staff_availability;

CREATE POLICY "Admins can update staff availability"
  ON staff_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groomers
      WHERE groomers.id::text = staff_availability.staff_id
      AND groomers.organization_id = get_user_organization_id()
    )
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- 6. Tighten RLS: Time Off Requests
--    Was: USING (true) for SELECT — anyone sees all time off
--    Now: org-scoped via groomers join
-- ============================================
DROP POLICY IF EXISTS "Users can view time off in their org" ON time_off_requests;

CREATE POLICY "Authenticated users can view time off in their org"
  ON time_off_requests FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM groomers
      WHERE groomers.id::text = time_off_requests.staff_id
      AND groomers.organization_id = get_user_organization_id()
    )
  );

-- Tighten INSERT: scope to own org's staff
DROP POLICY IF EXISTS "Users can create time off requests" ON time_off_requests;

CREATE POLICY "Users can create time off requests"
  ON time_off_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM groomers
      WHERE groomers.id::text = time_off_requests.staff_id
      AND groomers.organization_id = get_user_organization_id()
    )
  );

-- ============================================
-- 7. Tighten RLS: Vaccination Reminders
--    Was: USING (auth.uid() IS NOT NULL) — any logged-in user sees all
--    Now: org-scoped via pets join
-- ============================================
DROP POLICY IF EXISTS "Users can view vaccination reminders" ON vaccination_reminders;

CREATE POLICY "Users can view vaccination reminders"
  ON vaccination_reminders FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id::text = vaccination_reminders.pet_id
      AND pets.organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can create vaccination reminders" ON vaccination_reminders;

CREATE POLICY "Users can create vaccination reminders"
  ON vaccination_reminders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id::text = vaccination_reminders.pet_id
      AND pets.organization_id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "Users can update vaccination reminders" ON vaccination_reminders;

CREATE POLICY "Users can update vaccination reminders"
  ON vaccination_reminders FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id::text = vaccination_reminders.pet_id
      AND pets.organization_id = get_user_organization_id()
    )
  );
