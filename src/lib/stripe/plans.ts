export type PlanSlug = 'free' | 'pro' | 'agency';

export interface PlanInfo {
  id: string;
  name: string;
  slug: PlanSlug;
  price_monthly_cents: number;
  stripe_price_id: string | null;
  max_contacts: number | null;
  max_broadcasts_per_month: number | null;
  max_automations: number | null;
  max_team_members: number;
  has_advanced_reporting: boolean;
  has_api_access: boolean;
  has_custom_branding: boolean;
}

const PLAN_FEATURES: Record<PlanSlug, Omit<PlanInfo, 'id' | 'stripe_price_id'>> = {
  free: {
    name: 'Free',
    slug: 'free',
    price_monthly_cents: 0,
    max_contacts: 100,
    max_broadcasts_per_month: 50,
    max_automations: 3,
    max_team_members: 1,
    has_advanced_reporting: false,
    has_api_access: false,
    has_custom_branding: false,
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price_monthly_cents: 2900,
    max_contacts: 1000,
    max_broadcasts_per_month: 500,
    max_automations: 20,
    max_team_members: 3,
    has_advanced_reporting: true,
    has_api_access: false,
    has_custom_branding: false,
  },
  agency: {
    name: 'Agency',
    slug: 'agency',
    price_monthly_cents: 9900,
    max_contacts: 10000,
    max_broadcasts_per_month: 5000,
    max_automations: 100,
    max_team_members: 10,
    has_advanced_reporting: true,
    has_api_access: true,
    has_custom_branding: true,
  },
};

export function getPlanFeatures(slug: PlanSlug) {
  return PLAN_FEATURES[slug];
}
