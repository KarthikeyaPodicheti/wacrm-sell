import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function toDate(ts: unknown) {
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null
}

async function getFreePlanId(): Promise<string> {
  const { data } = await admin
    .from('plans')
    .select('id')
    .eq('slug', 'free')
    .single()
  return data!.id
}

/** Unsafe builder since Stripe v22 returns Response<T> (intersection)
 *  that confuses TS 6 when you access properties by string key. */
function subUpdate(body: Record<string, unknown>) {
  return body
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    )
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as unknown as Record<string, unknown>
      const userId = (session.metadata as Record<string, string>)?.user_id
      const subscriptionId = session.subscription as string

      if (userId && subscriptionId) {
        const subRes = await stripe.subscriptions.retrieve(subscriptionId)
        const sub = subRes as unknown as Record<string, unknown>
        const items = sub.items as Record<string, unknown>
        const itemData = (items.data as Record<string, unknown>[])[0]
        const priceId = (itemData.price as Record<string, string>).id

        const { data: plan } = await admin
          .from('plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single()

        await admin
          .from('subscriptions')
          .update(
            subUpdate({
              stripe_subscription_id: subscriptionId,
              status: sub.status,
              plan_id: plan?.id,
              current_period_start: toDate(sub.current_period_start),
              current_period_end: toDate(sub.current_period_end),
            }),
          )
          .eq('user_id', userId)
      }
      break
    }

    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as unknown as Record<string, unknown>
      const subscriptionId = invoice.subscription as string
      if (subscriptionId) {
        const subRes = await stripe.subscriptions.retrieve(subscriptionId)
        const sub = subRes as unknown as Record<string, unknown>
        await admin
          .from('subscriptions')
          .update(
            subUpdate({
              status: sub.status,
              current_period_start: toDate(sub.current_period_start),
              current_period_end: toDate(sub.current_period_end),
            }),
          )
          .eq('stripe_subscription_id', subscriptionId)
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as unknown as Record<string, unknown>
      const canceled =
        sub.status === 'canceled' || sub.status === 'incomplete_expired'

      const update: Record<string, unknown> = {
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_start: toDate(sub.current_period_start),
        current_period_end: toDate(sub.current_period_end),
      }

      if (canceled) {
        update.plan_id = await getFreePlanId()
        update.stripe_subscription_id = null
      } else {
        const items = sub.items as Record<string, unknown>
        const itemData = (items.data as Record<string, unknown>[])[0]
        const priceId = (itemData.price as Record<string, string>).id
        const { data: plan } = await admin
          .from('plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single()
        if (plan) update.plan_id = plan.id
      }

      await admin
        .from('subscriptions')
        .update(subUpdate(update))
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
