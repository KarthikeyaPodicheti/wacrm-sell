import { razorpay } from './client'
import { createClient } from '@/lib/supabase/server'

export async function getUserSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .single()

  return data
}

/**
 * Creates a Razorpay subscription and returns a checkout link.
 * The user completes payment on Razorpay's hosted page, then is
 * redirected back to the dashboard. The webhook handles the rest.
 */
export async function createSubscription(planId: string, userId: string, userEmail: string) {
  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (!plan || !plan.razorpay_plan_id) {
    throw new Error('Plan not found or Razorpay plan ID not configured')
  }

  // Convert cents to paise (INR)
  const totalCount = plan.slug === 'agency' ? 12 : 12

  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.razorpay_plan_id,
    customer_notify: 1,
    total_count: totalCount,
    notes: {
      user_id: userId,
      plan_slug: plan.slug,
    },
  })

  // Store the subscription reference in our DB
  await supabase.from('subscriptions').update({
    razorpay_subscription_id: subscription.id,
    status: subscription.status,
  }).eq('user_id', userId)

  return subscription
}

/**
 * Generates a Razorpay order for one-time payments (if needed).
 * For subscriptions this isn't used — Razorpay handles recurring
 * via subscription_id directly.
 */
export async function createOrder(amountPaise: number, userId: string) {
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    notes: { user_id: userId },
  })
  return order
}

/** Returns the customer portal-style page (Razorpay doesn't have
 *  a self-serve portal like Stripe). We use the billing page to
 *  let users cancel/manage via our API instead. */
export async function cancelSubscription(subscriptionId: string) {
  return razorpay.subscriptions.cancel(subscriptionId)
}
