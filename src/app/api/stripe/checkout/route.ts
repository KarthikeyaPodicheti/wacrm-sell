import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/subscription'

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json()
    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 },
      )
    }

    const session = await createCheckoutSession(priceId)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    console.error('Checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
