'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { getPlanFeatures, type PlanSlug } from '@/lib/stripe/plans'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  trialing: { label: 'Trial', variant: 'secondary' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline' },
  incomplete: { label: 'Incomplete', variant: 'outline' },
}

export default function BillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .single()

      setSubscription(data)
      setLoading(false)
    }
    load()
  }, [])

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Failed to open billing portal:', err)
    }
    setPortalLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="h-32 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  const plan = subscription?.plan
  const slug = plan?.slug as PlanSlug | undefined
  const features = slug ? getPlanFeatures(slug) : null
  const badge = STATUS_BADGE[subscription?.status] ?? { label: subscription?.status, variant: 'outline' as const }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your subscription and payment methods.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-violet-400" />
              <div>
                <CardTitle className="text-white">Current Plan</CardTitle>
                <CardDescription>
                  Your subscription details and usage
                </CardDescription>
              </div>
            </div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-white">{plan?.name ?? 'Free'}</span>
              {features && features.price_monthly_cents > 0 && (
                <span className="text-sm text-slate-400 ml-2">
                  ${features.price_monthly_cents / 100}/month
                </span>
              )}
            </div>
          </div>

          {subscription?.current_period_end && (
            <p className="text-sm text-slate-400">
              Current period ends{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}

          {features && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-xs text-slate-500">Contacts</p>
                <p className="text-sm text-white font-medium">
                  {features.max_contacts === null ? 'Unlimited' : features.max_contacts.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Broadcasts/mo</p>
                <p className="text-sm text-white font-medium">
                  {features.max_broadcasts_per_month === null
                    ? 'Unlimited'
                    : features.max_broadcasts_per_month.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Automations</p>
                <p className="text-sm text-white font-medium">
                  {features.max_automations === null ? 'Unlimited' : features.max_automations}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Team members</p>
                <p className="text-sm text-white font-medium">
                  {features.max_team_members}
                </p>
              </div>
            </div>
          )}

          {subscription?.stripe_customer_id && (
            <div className="pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={openPortal}
                disabled={portalLoading}
              >
                <ArrowUpRight className="size-4" />
                Manage billing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
