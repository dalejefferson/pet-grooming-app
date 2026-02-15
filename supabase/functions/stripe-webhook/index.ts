import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

Deno.serve(async (req) => {
  if (!WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Server misconfiguration', { status: 500 })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const body = await req.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  // Idempotency: skip already-processed events
  const { data: existingEvent } = await supabaseAdmin
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  // Resolve organization ID for logging
  const orgId = await resolveOrganizationId(event)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Subscription creation is handled by customer.subscription.created
        console.log('Checkout completed for org:', orgId)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break

      case 'customer.subscription.paused':
        await handleSubscriptionPaused(event)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event)
        break

      case 'customer.deleted':
        await handleCustomerDeleted(event)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err)
    // Log the event for audit trail even on failure, then return 500 so Stripe retries
    await supabaseAdmin.from('billing_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      organization_id: orgId,
      payload: event.data.object as Record<string, unknown>,
    })
    return new Response(JSON.stringify({ error: 'Processing failed, will retry' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  // Log event for audit trail
  await supabaseAdmin.from('billing_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    organization_id: orgId,
    payload: event.data.object as Record<string, unknown>,
  })

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})

// ============================================
// Helpers
// ============================================

async function resolveOrganizationId(event: { data: { object: Record<string, unknown> } }): Promise<string | null> {
  const obj = event.data.object

  // Check metadata first
  const metadata = obj.metadata as Record<string, string> | undefined
  if (metadata?.organization_id) return metadata.organization_id

  // Look up by customer ID
  const customerId = (obj.customer as string) || (obj.id as string)
  if (customerId) {
    const { data } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (data) return data.id
  }

  return null
}

async function getOrgIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

function resolvePlanTier(priceId: string): string | null {
  const PRICE_MAP: Record<string, string> = {}
  const soloMonthly = Deno.env.get('STRIPE_SOLO_MONTHLY_PRICE_ID')
  const soloYearly = Deno.env.get('STRIPE_SOLO_YEARLY_PRICE_ID')
  const studioMonthly = Deno.env.get('STRIPE_STUDIO_MONTHLY_PRICE_ID')
  const studioYearly = Deno.env.get('STRIPE_STUDIO_YEARLY_PRICE_ID')
  if (soloMonthly) PRICE_MAP[soloMonthly] = 'solo'
  if (soloYearly) PRICE_MAP[soloYearly] = 'solo'
  if (studioMonthly) PRICE_MAP[studioMonthly] = 'studio'
  if (studioYearly) PRICE_MAP[studioYearly] = 'studio'
  return PRICE_MAP[priceId] ?? null
}

// ============================================
// Event Handlers
// ============================================

async function handleSubscriptionUpsert(event: { data: { object: Record<string, unknown> } }) {
  const sub = event.data.object
  const customerId = sub.customer as string
  const metadata = sub.metadata as Record<string, string> | undefined
  const orgId = metadata?.organization_id || await getOrgIdByCustomer(customerId)

  if (!orgId) {
    throw new Error(`Cannot resolve organization for subscription ${sub.id}`)
  }

  // Extract price info from line items
  const items = sub.items as { data: Array<{ price: { id: string; recurring?: { interval: string } } }> } | undefined
  const priceId = items?.data?.[0]?.price?.id ?? ''
  const interval = items?.data?.[0]?.price?.recurring?.interval

  const planTier = resolvePlanTier(priceId) || metadata?.plan_tier || 'solo'
  const billingInterval = interval === 'year' ? 'yearly' : 'monthly'

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      organization_id: orgId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id as string,
      plan_tier: planTier,
      billing_interval: billingInterval,
      status: sub.status as string,
      trial_start: sub.trial_start ? new Date((sub.trial_start as number) * 1000).toISOString() : null,
      trial_end: sub.trial_end ? new Date((sub.trial_end as number) * 1000).toISOString() : null,
      current_period_start: new Date((sub.current_period_start as number) * 1000).toISOString(),
      current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
      cancel_at_period_end: (sub.cancel_at_period_end as boolean) ?? false,
      canceled_at: sub.canceled_at ? new Date((sub.canceled_at as number) * 1000).toISOString() : null,
    }, {
      onConflict: 'organization_id',
    })
}

async function handleSubscriptionDeleted(event: { data: { object: Record<string, unknown> } }) {
  const sub = event.data.object
  const customerId = sub.customer as string
  const metadata = sub.metadata as Record<string, string> | undefined
  const orgId = metadata?.organization_id || await getOrgIdByCustomer(customerId)

  if (!orgId) {
    throw new Error(`Cannot resolve organization for deleted subscription ${sub.id}`)
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
}

async function handleInvoicePaymentFailed(event: { data: { object: Record<string, unknown> } }) {
  const invoice = event.data.object
  const customerId = invoice.customer as string
  const orgId = await getOrgIdByCustomer(customerId)

  if (!orgId) {
    throw new Error(`Cannot resolve organization for failed invoice ${invoice.id}`)
  }

  // Mark subscription as past_due if currently active or trialing
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('organization_id', orgId)
    .in('status', ['active', 'trialing'])
}

async function handleTrialWillEnd(event: { data: { object: Record<string, unknown> } }) {
  const sub = event.data.object
  const customerId = sub.customer as string
  const metadata = sub.metadata as Record<string, string> | undefined
  const orgId = metadata?.organization_id || await getOrgIdByCustomer(customerId)

  if (!orgId) return

  // Create an in-app notification
  await supabaseAdmin.from('in_app_notifications').insert({
    organization_id: orgId,
    type: 'general',
    title: 'Trial Ending Soon',
    message: 'Your free trial ends in 3 days. Add a payment method to continue using Sit Pretty Club.',
  })
}

async function handleSubscriptionPaused(event: { data: { object: Record<string, unknown> } }) {
  const sub = event.data.object
  const customerId = sub.customer as string
  const metadata = sub.metadata as Record<string, string> | undefined
  const orgId = metadata?.organization_id || await getOrgIdByCustomer(customerId)

  if (!orgId) {
    throw new Error('Organization not found for paused subscription')
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('organization_id', orgId)
}

async function handleInvoicePaymentSucceeded(event: { data: { object: Record<string, unknown> } }) {
  const invoice = event.data.object
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string | undefined

  console.log('Invoice payment succeeded:', invoice.id)

  if (!subscriptionId) return

  const orgId = await getOrgIdByCustomer(customerId)
  if (!orgId) return

  // If subscription was past_due, mark it active now that payment succeeded
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('organization_id', orgId)
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'past_due')
}

async function handleCustomerDeleted(event: { data: { object: Record<string, unknown> } }) {
  const customer = event.data.object
  const customerId = customer.id as string

  console.log('Customer deleted:', customerId)

  await supabaseAdmin
    .from('organizations')
    .update({ stripe_customer_id: null })
    .eq('stripe_customer_id', customerId)
}
