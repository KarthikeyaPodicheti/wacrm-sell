'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, IndianRupee, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getPlanFeatures, PLAN_PRICING, type PlanSlug } from '@/lib/plans'

type Currency = 'usd' | 'inr'

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
  const [currency, setCurrency] = useState<Currency>('inr')
  const [loading, setLoading] = useState<{ slug: PlanSlug; provider: 'stripe' | 'razorpay' } | null>(null)

  async function handleSubscribe(slug: PlanSlug) {
    if (slug === 'free') {
      router.push('/signup')
      return
    }

    if (currency === 'inr') {
      setLoading({ slug, provider: 'razorpay' })
      const res = await fetch('/api/razorpay/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: slug }),
      })
      const data = await res.json()
      if (data.short_url) {
        window.location.href = data.short_url
      } else {
        const err = data.error || 'Something went wrong'
        if (err !== 'Authentication required') alert(err)
        else router.push('/signup')
        setLoading(null)
      }
    } else {
      setLoading({ slug, provider: 'stripe' })
      router.push('/signup')
    }
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

          {/* Currency toggle */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrency('usd')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                currency === 'usd'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="size-4" />
              USD
            </button>
            <button
              onClick={() => setCurrency('inr')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                currency === 'inr'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <IndianRupee className="size-4" />
              INR
            </button>
          </div>

          {currency === 'inr' && (
            <p className="text-xs text-slate-500">
              Pay via UPI, Credit/Debit Card, Net Banking, or Wallet. No international fees.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((slug) => {
            const plan = getPlanFeatures(slug)
            const pricing = PLAN_PRICING[slug][currency]
            const meta = PLAN_META[slug]
            const isUsd = currency === 'usd'
            const isLoading = loading?.slug === slug

            return (
              <Card
                key={slug}
                className={`relative flex flex-col bg-slate-900 border-slate-700 ${
                  meta.highlight ? 'ring-2 ring-violet-500 scale-105' : ''
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
                      {pricing.price_display}
                    </span>
                    {pricing.price_cents > 0 && (
                      <span className="text-slate-400 text-sm">/{isUsd ? 'month' : 'mo'}</span>
                    )}
                  </div>

                  {currency === 'inr' && pricing.price_cents > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-800 px-2 py-0.5">UPI</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5">Card</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5">Net Banking</span>
                    </div>
                  )}

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
                    disabled={isLoading}
                    onClick={() => handleSubscribe(slug)}
                  >
                    {slug === 'free'
                      ? 'Get started free'
                      : isLoading
                        ? 'Processing...'
                        : isUsd
                          ? `Subscribe $${pricing.price_cents / 100}/mo`
                          : `Subscribe ₹${(pricing.price_cents / 100).toLocaleString('en-IN')}/mo`}
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
