-- Migration: Enforce staff limits per subscription tier
-- Solo plan: 1 staff member max
-- Studio plan: unlimited staff members
-- No subscription: 1 staff member (grace period / onboarding)

-- Helper: count active groomers for an organization
CREATE OR REPLACE FUNCTION get_org_staff_count(org_uuid UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM groomers WHERE organization_id = org_uuid;
$$;

-- Helper: get the plan tier for an organization's active subscription
CREATE OR REPLACE FUNCTION get_org_plan_tier(org_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT plan_tier::TEXT
  FROM subscriptions
  WHERE organization_id = org_uuid
    AND status IN ('trialing', 'active', 'past_due')
  LIMIT 1;
$$;

-- RLS policy: enforce staff limit on groomers INSERT
CREATE POLICY "Enforce staff limit per subscription tier"
  ON groomers FOR INSERT WITH CHECK (
    -- Studio tier: unlimited
    (get_org_plan_tier(organization_id) = 'studio')
    OR
    -- Solo tier: max 1
    (get_org_plan_tier(organization_id) = 'solo'
      AND get_org_staff_count(organization_id) < 1)
    OR
    -- No subscription (grace period): allow 1
    (get_org_plan_tier(organization_id) IS NULL
      AND get_org_staff_count(organization_id) < 1)
  );

-- RLS policy: only Studio tier can add service modifiers
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
