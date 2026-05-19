-- ============================================================
-- 009_subscriptions.sql — Stripe subscriptions & plans
--
-- Idempotent — safe to run multiple times.
--
-- Adds:
--   plans          — seeded product catalog (Free / Pro / Agency)
--   subscriptions  — per-user active subscription + Stripe IDs
--   auto-create free subscription on user signup
-- ============================================================

-- ── PLANS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  stripe_price_id TEXT,
  price_monthly_cents INTEGER NOT NULL,
  max_contacts INTEGER,
  max_broadcasts_per_month INTEGER,
  max_automations INTEGER,
  max_team_members INTEGER NOT NULL DEFAULT 1,
  has_advanced_reporting BOOLEAN NOT NULL DEFAULT FALSE,
  has_api_access BOOLEAN NOT NULL DEFAULT FALSE,
  has_custom_branding BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Plans are publicly readable" ON plans;
CREATE POLICY "Plans are publicly readable" ON plans
  FOR SELECT USING (TRUE);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ── SEED PLANS ───────────────────────────────────────────────
INSERT INTO plans (name, slug, description, price_monthly_cents,
                   max_contacts, max_broadcasts_per_month, max_automations,
                   max_team_members, has_advanced_reporting, has_api_access,
                   has_custom_branding, sort_order)
VALUES
  ('Free',     'free',    'Get started with basic CRM features',       0,    100,   50,   3,   1, FALSE, FALSE, FALSE, 1),
  ('Pro',      'pro',     'For growing businesses',                 2900,   1000,  500,  20,   3,  TRUE,  FALSE, FALSE, 2),
  ('Agency',   'agency',  'For agencies and power users',           9900,  10000, 5000, 100,  10,  TRUE,  TRUE,  TRUE,  3)
ON CONFLICT (slug) DO UPDATE SET
  name               = EXCLUDED.name,
  description        = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  max_contacts       = EXCLUDED.max_contacts,
  max_broadcasts_per_month = EXCLUDED.max_broadcasts_per_month,
  max_automations    = EXCLUDED.max_automations,
  max_team_members   = EXCLUDED.max_team_members,
  has_advanced_reporting = EXCLUDED.has_advanced_reporting,
  has_api_access     = EXCLUDED.has_api_access,
  has_custom_branding = EXCLUDED.has_custom_branding,
  sort_order         = EXCLUDED.sort_order,
  is_active          = EXCLUDED.is_active;

-- ── AUTO-CREATE FREE SUBSCRIPTION ON SIGNUP ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id, status)
  VALUES (
    NEW.id,
    (SELECT id FROM public.plans WHERE slug = 'free'),
    'active'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user_subscription() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- ── UPDATED_AT TRIGGER for subscriptions ─────────────────────
DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
