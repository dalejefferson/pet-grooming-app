import { Resend } from 'https://esm.sh/resend@4'

export const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
