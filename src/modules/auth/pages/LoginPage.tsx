import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { Button, Input, Card } from '@/modules/ui/components/common'
import { useLogin } from '../hooks/useAuth'
import { APP_NAME } from '@/config/constants'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('admin@pawsclaws.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')

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
