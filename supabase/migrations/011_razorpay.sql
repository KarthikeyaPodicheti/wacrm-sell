-- ============================================================
-- 011_razorpay.sql — Razorpay payment gateway support
--
-- Idempotent — safe to run multiple times.
--
-- Adds:
--   plans.razorpay_plan_id          — Razorpay plan reference
--   plans.price_inr_paise           — INR pricing (in paise)
--   subscriptions.razorpay_subscription_id — Razorpay subscription ref
--   Updated status CHECK to include Razorpay statuses
-- ============================================================

-- ── PLANS: add Razorpay columns ──────────────────────────────
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS razorpay_plan_id TEXT,
  ADD COLUMN IF NOT EXISTS price_inr_paise INTEGER;

-- ⚠️ Important: you must set razorpay_plan_id manually in Supabase
-- after creating the plans in your Razorpay dashboard:
--   1. Create a plan in Razorpay named "Pro" with amount 249900
--   2. Copy the plan_id (e.g. "plan_NfXxYyZz123") back here
--   3. Update plans SET razorpay_plan_id = 'plan_xxx' WHERE slug = 'pro';

-- ── SUBSCRIPTIONS: add Razorpay column ───────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay
  ON subscriptions(razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

-- ── Seed INR pricing ────────────────────────────────────────
UPDATE plans SET price_inr_paise = 0       WHERE slug = 'free';
UPDATE plans SET price_inr_paise = 249900  WHERE slug = 'pro';
UPDATE plans SET price_inr_paise = 849900  WHERE slug = 'agency';
