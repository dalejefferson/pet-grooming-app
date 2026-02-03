import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { Button, Input, Card } from '@/modules/ui/components/common'
import { useLogin } from '../hooks/useAuth'
import { APP_NAME } from '@/config/constants'
import { supabase } from '@/lib/supabase/client'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('admin@pawsclaws.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login.mutateAsync({ email, password })
      navigate('/app/calendar')
    } catch (err) {
      setError('Invalid email or password')
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Dog className="mx-auto h-12 w-12 text-primary-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {error && (
              <p className="text-sm text-danger-600">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={login.isPending}
            >
              Sign in
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#1e293b]/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-[#64748b] font-medium">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#1e293b] bg-white px-4 py-2 text-sm font-semibold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Sign in with Google
          </button>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <p className="font-medium mb-1">Demo Accounts (password: demo123):</p>
            <div className="space-y-1">
              <button type="button" onClick={() => { setEmail('admin@pawsclaws.com'); setPassword('demo123') }} className="block w-full text-left hover:text-[#1e293b] transition-colors">
                <span className="font-medium">Owner:</span> admin@pawsclaws.com
              </button>
              <button type="button" onClick={() => { setEmail('mike@pawsclaws.com'); setPassword('demo123') }} className="block w-full text-left hover:text-[#1e293b] transition-colors">
                <span className="font-medium">Groomer:</span> mike@pawsclaws.com
              </button>
              <button type="button" onClick={() => { setEmail('alex@pawsclaws.com'); setPassword('demo123') }} className="block w-full text-left hover:text-[#1e293b] transition-colors">
                <span className="font-medium">Receptionist:</span> alex@pawsclaws.com
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
