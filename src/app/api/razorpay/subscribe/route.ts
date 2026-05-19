import { NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { planSlug } = await request.json()
  if (!planSlug) {
    return NextResponse.json({ error: 'planSlug is required' }, { status: 400 })
  }

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', planSlug)
    .single()

  if (!plan || !plan.razorpay_plan_id) {
    return NextResponse.json(
      { error: 'Razorpay not configured for this plan. Please contact support.' },
      { status: 400 },
    )
  }

  try {
    const sub = await razorpay.subscriptions.create({
      plan_id: plan.razorpay_plan_id,
      customer_notify: 1,
      total_count: 12,
      notes: { user_id: user.id, plan_slug: plan.slug },
    })

    await supabase
      .from('subscriptions')
      .update({
        razorpay_subscription_id: sub.id,
        status: sub.status,
        plan_id: plan.id,
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      subscription_id: sub.id,
      short_url: sub.short_url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Razorpay error'
    console.error('Razorpay subscription error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
