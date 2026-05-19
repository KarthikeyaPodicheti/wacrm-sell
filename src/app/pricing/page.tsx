'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getPlanFeatures, type PlanSlug } from '@/lib/stripe/plans'

const PLANS: PlanSlug[] = ['free', 'pro', 'agency']

const PLAN_META: Record<PlanSlug, { desc: string; features: string[]; highlight?: boolean }> = {
  free: {
    desc: 'Get started with basic CRM features',
    features: [
      'Up to 100 contacts',
      '50 broadcasts per month',
      '3 automations',
      '1 team member',
      'Basic dashboard',
    ],
  },
  pro: {
    desc: 'For growing businesses',
    features: [
      'Up to 1,000 contacts',
      '500 broadcasts per month',
      '20 automations',
      '3 team members',
      'Advanced reporting',
      'Priority support',
    ],
    highlight: true,
  },
  agency: {
    desc: 'For agencies and power users',
    features: [
      'Up to 10,000 contacts',
      '5,000 broadcasts per month',
      '100 automations',
      '10 team members',
      'API access',
      'Custom branding',
      'Dedicated support',
    ],
  },
}

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<PlanSlug | null>(null)

  async function handleUpgrade(slug: PlanSlug) {
    if (slug === 'free') {
      router.push('/signup')
      return
    }
    setLoading(slug)
    router.push('/signup')
    // After signup, redirect to pricing to pick a plan
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-6xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Start free. Upgrade as you grow. No hidden fees, no surprises.
          </p>
          <p className="text-sm text-slate-500">
            Pay with card or UPI (India). 7-day free trial on all paid plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((slug) => {
            const plan = getPlanFeatures(slug)
            const meta = PLAN_META[slug]

            return (
              <Card
                key={slug}
                className={`relative flex flex-col bg-slate-900 border-slate-700 ${
                  meta.highlight
                    ? 'ring-2 ring-violet-500 scale-105'
                    : ''
                }`}
              >
                {meta.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
                      Most popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {meta.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {plan.price_monthly_cents === 0
                        ? 'Free'
                        : `$${plan.price_monthly_cents / 100}`}
                    </span>
                    {plan.price_monthly_cents > 0 && (
                      <span className="text-slate-400 text-sm">/month</span>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1">
                    {meta.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check className="size-4 text-violet-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={slug === 'free' ? 'outline' : 'default'}
                    size="lg"
                    className="w-full"
                    disabled={loading === slug}
                    onClick={() => handleUpgrade(slug)}
                  >
                    {slug === 'free' ? 'Get started free' : 'Upgrade to ' + plan.name}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
