import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SubscriptionInfo {
  id: string
  plan_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: string
  plan: {
    id: string
    name: string
    slug: string
    price_monthly_cents: number
  } | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('user_id', user.id)
        .single()

      if (mounted) {
        setSubscription(data)
        setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return { subscription, loading, planSlug: subscription?.plan?.slug ?? 'free' as string }
}
