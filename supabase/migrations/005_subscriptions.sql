-- ============================================
-- Subscriptions & Billing
-- ============================================

-- Subscriptions table (one per organization)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('solo', 'studio')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid',
    'incomplete', 'incomplete_expired', 'paused'
  )),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log for Stripe webhook events (idempotency + debugging)
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add stripe_customer_id to organizations for quick lookups
ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_billing_events_stripe_id ON billing_events(stripe_event_id);
CREATE INDEX idx_billing_events_org ON billing_events(organization_id);
CREATE INDEX idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row-Level Security
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own org's subscription
CREATE POLICY "Users can view own org subscription"
  ON subscriptions FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Only service role (Edge Functions) can insert/update subscriptions
-- No INSERT/UPDATE/DELETE policies for authenticated users

-- Admins can view their org's billing events (for debugging)
CREATE POLICY "Admins can view own org billing events"
  ON billing_events FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Only service role (Edge Functions) can insert billing events
-- No INSERT/UPDATE/DELETE policies for authenticated users
