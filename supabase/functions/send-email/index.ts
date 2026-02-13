import { corsHeaders } from '../_shared/cors.ts'
import { resend } from '../_shared/resend.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

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

    const { to, subject, body, replyTo, senderName } = await req.json()

    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body')
    }

    const { data, error } = await resend.emails.send({
      from: `${senderName || 'Sit Pretty Club'} <onboarding@resend.dev>`,
      to,
      subject,
      html: `<p>${body}</p>`,
      ...(replyTo ? { reply_to: replyTo } : {}),
    })

    if (error) {
      throw new Error(error.message)
    }

    return new Response(
      JSON.stringify({ messageId: data?.id }),
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
