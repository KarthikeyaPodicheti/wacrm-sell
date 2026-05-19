import { NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe/subscription'

export async function POST() {
  try {
    const session = await createPortalSession()
    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create portal session'
    console.error('Portal error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
