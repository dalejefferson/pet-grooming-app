const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
]

/**
 * Build CORS headers with dynamic origin matching.
 * Checks the request's Origin header against an allowlist
 * (defaults + ALLOWED_ORIGIN env var).
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = [...DEFAULT_ALLOWED_ORIGINS]
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN')
  if (envOrigin) {
    allowedOrigins.push(envOrigin)
  }

  const requestOrigin = req.headers.get('origin') ?? ''
  const matchedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Backwards-compatible static export (uses first allowed origin as default)
export const corsHeaders = {
  'Access-Control-Allow-Origin': DEFAULT_ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
