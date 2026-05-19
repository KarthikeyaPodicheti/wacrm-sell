export type PlanSlug = 'free' | 'pro' | 'agency'

export interface PlanFeatures {
  name: string
  slug: PlanSlug
  max_contacts: number | null
  max_broadcasts_per_month: number | null
  max_automations: number | null
  max_team_members: number
  has_advanced_reporting: boolean
  has_api_access: boolean
  has_custom_branding: boolean
}

export interface PlanPricing {
  price_cents: number
  price_display: string
}

export const PLAN_FEATURES: Record<PlanSlug, PlanFeatures> = {
  free: {
    name: 'Free', slug: 'free',
    max_contacts: 100, max_broadcasts_per_month: 50, max_automations: 3,
    max_team_members: 1, has_advanced_reporting: false, has_api_access: false, has_custom_branding: false,
  },
  pro: {
    name: 'Pro', slug: 'pro',
    max_contacts: 1000, max_broadcasts_per_month: 500, max_automations: 20,
    max_team_members: 3, has_advanced_reporting: true, has_api_access: false, has_custom_branding: false,
  },
  agency: {
    name: 'Agency', slug: 'agency',
    max_contacts: 10000, max_broadcasts_per_month: 5000, max_automations: 100,
    max_team_members: 10, has_advanced_reporting: true, has_api_access: true, has_custom_branding: true,
  },
}

export const PLAN_PRICING: Record<PlanSlug, { usd: PlanPricing; inr: PlanPricing }> = {
  free: {
    usd: { price_cents: 0, price_display: 'Free' },
    inr: { price_cents: 0, price_display: 'Free' },
  },
  pro: {
    usd: { price_cents: 2900, price_display: '$29' },
    inr: { price_cents: 249900, price_display: '₹2,499' },
  },
  agency: {
    usd: { price_cents: 9900, price_display: '$99' },
    inr: { price_cents: 849900, price_display: '₹8,499' },
  },
}

export function getPlanFeatures(slug: PlanSlug) {
  return PLAN_FEATURES[slug]
}
