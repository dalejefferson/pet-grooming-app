-- ============================================
-- 011: Replace unscoped anonymous SELECT policies
-- on clients and pets with SECURITY DEFINER RPC functions.
--
-- Problem: Anonymous users (booking flow) could SELECT
-- all clients/pets across all organizations.
--
-- Fix: Drop the anon SELECT policies entirely.
-- Create RPC functions that enforce org scoping internally.
-- The booking flow calls these RPCs instead of direct table access.
-- Authenticated users still use direct table access via org-scoped RLS.
-- ============================================

-- ============================================
-- 1. Drop dangerous unscoped anon SELECT policies
-- ============================================

-- Clients: anon SELECT was USING (auth.uid() IS NULL) — no org scope
DROP POLICY IF EXISTS "Anon can view clients for booking" ON clients;

-- Pets: anon SELECT was USING (auth.uid() IS NULL) — no org scope
DROP POLICY IF EXISTS "Anon can view pets for booking" ON pets;

-- ============================================
-- 2. Create SECURITY DEFINER RPC functions
--    These run with elevated privileges but enforce
--    org scoping internally, so anonymous callers
--    can only access data within the specified org.
-- ============================================

-- 2a. Lookup a client by email within a specific organization.
-- Used by the booking flow to check if a returning client exists.
-- Returns at most one row.
CREATE OR REPLACE FUNCTION lookup_client_by_email(
  p_org_id UUID,
  p_email TEXT
)
RETURNS SETOF clients
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM clients
  WHERE organization_id = p_org_id
    AND LOWER(email) = LOWER(p_email)
  LIMIT 1;
$$;

-- 2b. Search clients by query string within a specific organization.
-- Used by the booking flow's email lookup on BookingStartPage.
-- Returns matching clients (case-insensitive partial match).
CREATE OR REPLACE FUNCTION search_clients_for_booking(
  p_org_id UUID,
  p_query TEXT
)
RETURNS SETOF clients
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM clients
  WHERE organization_id = p_org_id
    AND (
      first_name ILIKE '%' || p_query || '%'
      OR last_name ILIKE '%' || p_query || '%'
      OR email ILIKE '%' || p_query || '%'
      OR phone ILIKE '%' || p_query || '%'
    );
$$;

-- 2c. Get a single client by ID, verified to belong to the specified org.
-- Used by the booking flow to load returning client data.
CREATE OR REPLACE FUNCTION get_client_for_booking(
  p_org_id UUID,
  p_client_id UUID
)
RETURNS SETOF clients
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM clients
  WHERE id = p_client_id
    AND organization_id = p_org_id
  LIMIT 1;
$$;

-- 2d. Get pets belonging to a client, verified to belong to the specified org.
-- Used by the booking flow to show a returning client's pets.
CREATE OR REPLACE FUNCTION get_pets_for_booking(
  p_org_id UUID,
  p_client_id UUID
)
RETURNS SETOF pets
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.*
  FROM pets p
  WHERE p.client_id = p_client_id
    AND p.organization_id = p_org_id;
$$;

-- 2e. Get a single pet by ID, verified to belong to the specified org.
-- Used by the booking creation flow to validate pet ownership.
CREATE OR REPLACE FUNCTION get_pet_for_booking(
  p_org_id UUID,
  p_pet_id UUID
)
RETURNS SETOF pets
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM pets
  WHERE id = p_pet_id
    AND organization_id = p_org_id
  LIMIT 1;
$$;

-- ============================================
-- 3. Grant EXECUTE on RPC functions to anon role
--    so the booking flow (unauthenticated) can call them.
-- ============================================
GRANT EXECUTE ON FUNCTION lookup_client_by_email(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_clients_for_booking(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_client_for_booking(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_pets_for_booking(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_pet_for_booking(UUID, UUID) TO anon;

-- Also grant to authenticated role (in case staff use these paths)
GRANT EXECUTE ON FUNCTION lookup_client_by_email(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_clients_for_booking(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_for_booking(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pets_for_booking(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pet_for_booking(UUID, UUID) TO authenticated;
