import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

const PRICE_IDS: Record<string, string> = {
  solo_monthly: Deno.env.get('STRIPE_SOLO_MONTHLY_PRICE_ID')!,
  solo_yearly: Deno.env.get('STRIPE_SOLO_YEARLY_PRICE_ID')!,
  studio_monthly: Deno.env.get('STRIPE_STUDIO_MONTHLY_PRICE_ID')!,
  studio_yearly: Deno.env.get('STRIPE_STUDIO_YEARLY_PRICE_ID')!,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { planTier, billingInterval } = await req.json()

    const priceKey = `${planTier}_${billingInterval}`
    const priceId = PRICE_IDS[priceKey]
    if (!priceId) throw new Error(`Invalid plan: ${priceKey}`)

    // Get user's organization
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) throw new Error('User profile not found')

    const orgId = userProfile.organization_id

    // Get or create Stripe customer
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id, name, email')
      .eq('id', orgId)
      .single()

    let stripeCustomerId = org?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: org?.name || undefined,
        metadata: {
          organization_id: orgId,
          supabase_user_id: user.id,
        },
      })
      stripeCustomerId = customer.id

      await supabaseAdmin
        .from('organizations')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', orgId)
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('organization_id', orgId)
      .in('status', ['trialing', 'active', 'past_due'])
      .maybeSingle()

    if (existingSub) {
      throw new Error('Organization already has an active subscription. Use the billing portal to change plans.')
    }

    // Determine origin for redirect URLs
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          organization_id: orgId,
          plan_tier: planTier,
        },
      },
      success_url: `${origin}/app/settings?billing=success`,
      cancel_url: `${origin}/app/settings?billing=canceled`,
      metadata: {
        organization_id: orgId,
        plan_tier: planTier,
        billing_interval: billingInterval,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
