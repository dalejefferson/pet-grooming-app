import { getCorsHeaders } from '../_shared/cors.ts'
import { resend } from '../_shared/resend.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { to, subject, html, replyTo, senderName } = body

    // Auth path 1: Standard JWT auth (for authenticated staff actions)
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !user) throw new Error('Unauthorized')
    }
    // Auth path 2: Booking mode — verify appointment exists, resolve recipient from DB
    else if (body.bookingId) {
      const { data: appointment, error: aptError } = await supabaseAdmin
        .from('appointments')
        .select('id, client_id, groomer_id')
        .eq('id', body.bookingId)
        .single()

      if (aptError || !appointment) {
        throw new Error('Invalid booking ID')
      }

      if (body.staffAlert && appointment.groomer_id) {
        // Staff alert mode: send to the groomer's email
        const { data: groomer, error: groomerError } = await supabaseAdmin
          .from('groomers')
          .select('email')
          .eq('id', appointment.groomer_id)
          .single()

        if (groomerError || !groomer?.email) {
          throw new Error('Groomer email not found')
        }

        body.to = groomer.email
      } else {
        // Client confirmation mode: send to the client's email
        const { data: client, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('email')
          .eq('id', appointment.client_id)
          .single()

        if (clientError || !client?.email) {
          throw new Error('Client email not found')
        }

        body.to = client.email
      }
    } else {
      throw new Error('Missing authorization header')
    }

    const emailTo = body.to || to
    const emailSubject = body.subject || subject

    if (!emailTo || !emailSubject || (!body.body && !html)) {
      throw new Error('Missing required fields: to, subject, and either body or html')
    }

    if (!isValidEmail(emailTo)) {
      return new Response(JSON.stringify({ error: 'Invalid email address format' }), { status: 400, headers: corsHeaders })
    }

    const emailHtml = html || `<p>${body.body}</p>`

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'

    const { data, error } = await resend.emails.send({
      from: `${senderName || 'Sit Pretty Club'} <${fromEmail}>`,
      to: emailTo,
      subject: emailSubject,
      html: emailHtml,
      ...(replyTo ? { replyTo } : {}),
    })

    if (error) {
      console.error('[send-email] Resend error:', error.message)
      throw new Error(error.message)
    }

    console.log('[send-email] Sent to:', emailTo, 'messageId:', data?.id)
    return new Response(
      JSON.stringify({ messageId: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[send-email] Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
