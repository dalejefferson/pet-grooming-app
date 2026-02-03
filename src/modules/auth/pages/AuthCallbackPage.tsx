import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { authApi } from '@/modules/auth/api/authApi'
import { useToast } from '@/modules/ui/context/ToastContext'
import { LoadingPage } from '@/modules/ui/components/common'
import { Dog } from 'lucide-react'
import { APP_NAME } from '@/config/constants'

const SESSION_TIMEOUT_MS = 10_000
const NEW_USER_THRESHOLD_MS = 60_000

function getUrlError(searchParams: URLSearchParams): string | null {
  const errorParam = searchParams.get('error')
  if (errorParam) {
    return searchParams.get('error_description') || errorParam
  }
  return null
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(() => getUrlError(searchParams))
  const { showSuccess } = useToast()
  const handledRef = useRef(false)

  useEffect(() => {
    // If the URL already contains an error, don't listen for auth changes
    if (error) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function handleSession() {
      if (handledRef.current) return
      handledRef.current = true

      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }

      // Fetch the user profile for welcome toast
      try {
        const user = await authApi.getCurrentUser()

        if (user) {
          const createdAt = new Date(user.createdAt).getTime()
          const now = Date.now()
          const isNewUser = now - createdAt < NEW_USER_THRESHOLD_MS

          if (isNewUser) {
            showSuccess(`Welcome to ${APP_NAME}!`, 'Your account has been created')
          } else {
            const firstName = user.name.split(' ')[0]
            showSuccess(`Welcome back, ${firstName}!`)
          }
        }
      } catch {
        // Profile fetch failed — still navigate, just skip the toast
      }

      navigate('/app/dashboard', { replace: true })
    }

    // Listen for auth state changes (catches the event if exchange hasn't completed yet)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          handleSession()
        }
      }
    )

    // Also check if a session already exists (catches the case where AuthProvider's
    // getSession() already triggered the code exchange before this component mounted)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession()
      }
    })

    // Timeout: if no session is established within the threshold, show an error
    timeoutId = setTimeout(() => {
      if (!handledRef.current) {
        handledRef.current = true
        setError('Sign in timed out. Please try again.')
      }
    }, SESSION_TIMEOUT_MS)

    return () => {
      subscription.unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [error, navigate, showSuccess])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <Dog className="mx-auto h-12 w-12 text-danger-500" />
          <h1 className="mt-4 text-2xl font-bold text-[#1e293b]">{APP_NAME}</h1>
          <div className="mt-6 rounded-2xl border-2 border-[#1e293b] bg-white p-6 shadow-[3px_3px_0px_0px_#1e293b]">
            <p className="text-sm font-semibold text-danger-600 mb-2">Sign in failed</p>
            <p className="text-sm text-[#64748b]">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-4 inline-flex items-center justify-center rounded-xl border-2 border-[#1e293b] bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b] hover:bg-primary-600"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <LoadingPage />
}
