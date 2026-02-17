import { getCorsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    // Get user's org and stripe customer ID
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) throw new Error('User profile not found')

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', userProfile.organization_id)
      .single()

    if (!org?.stripe_customer_id) {
      throw new Error('No billing account found. Please subscribe to a plan first.')
    }

    const body = await req.json().catch(() => ({}))

    // Fetch invoices and customer with default payment method in parallel
    const [invoiceList, customer] = await Promise.all([
      stripe.invoices.list({
        customer: org.stripe_customer_id,
        limit: body.limit || 10,
        starting_after: body.startingAfter || undefined,
      }),
      stripe.customers.retrieve(org.stripe_customer_id, {
        expand: ['invoice_settings.default_payment_method'],
      }),
    ])

    // Map invoices to minimal camelCase shape
    const invoices = invoiceList.data.map((inv: Record<string, unknown>) => ({
      id: inv.id,
      number: inv.number,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      invoicePdf: inv.invoice_pdf,
      hostedInvoiceUrl: inv.hosted_invoice_url,
    }))

    // Extract default payment method card info
    let paymentMethod = null
    if (
      customer &&
      !customer.deleted &&
      customer.invoice_settings?.default_payment_method &&
      typeof customer.invoice_settings.default_payment_method === 'object'
    ) {
      const card = customer.invoice_settings.default_payment_method.card
      if (card) {
        paymentMethod = {
          brand: card.brand,
          last4: card.last4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
        }
      }
    }

    return new Response(
      JSON.stringify({ invoices, hasMore: invoiceList.has_more, paymentMethod }),
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
