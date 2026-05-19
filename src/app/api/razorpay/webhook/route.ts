import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const isValid = validateWebhookSignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET!,
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const payload = event.payload
  const subId = payload?.subscription?.entity?.id

  // Map Razorpay status to our status
  const STATUS_MAP: Record<string, string> = {
    created: 'incomplete',
    authenticated: 'active',
    active: 'active',
    pending: 'past_due',
    halted: 'past_due',
    completed: 'canceled',
    expired: 'canceled',
    cancelled: 'canceled',
  }

  switch (event.event) {
    case 'subscription.activated':
    case 'subscription.charged':
    case 'subscription.completed':
    case 'subscription.halted':
    case 'subscription.pending': {
      const entity = payload.subscription?.entity
      if (!entity?.id || !entity?.notes?.user_id) break

      const status = STATUS_MAP[entity.status] ?? entity.status
      const update: Record<string, unknown> = {
        status,
        current_period_start: entity.current_start
          ? new Date(entity.current_start * 1000).toISOString()
          : null,
        current_period_end: entity.current_end
          ? new Date(entity.current_end * 1000).toISOString()
          : null,
      }

      if (status === 'canceled' || status === 'expired') {
        const { data: freePlan } = await admin
          .from('plans')
          .select('id')
          .eq('slug', 'free')
          .single()
        if (freePlan) update.plan_id = freePlan.id
      }

      await admin
        .from('subscriptions')
        .update(update)
        .eq('razorpay_subscription_id', entity.id)
      break
    }

    case 'subscription.cancelled': {
      const entity = payload.subscription?.entity
      if (!entity?.id) break

      const { data: freePlan } = await admin
        .from('plans')
        .select('id')
        .eq('slug', 'free')
        .single()

      await admin
        .from('subscriptions')
        .update({
          status: 'canceled',
          razorpay_subscription_id: null,
          plan_id: freePlan?.id,
        })
        .eq('razorpay_subscription_id', entity.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
