import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

interface AuthContextValue {
  sessionInitialized: boolean
}

const AuthContext = createContext<AuthContextValue>({ sessionInitialized: false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(() => {
      setSessionInitialized(true)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      } else if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(['currentUser'], null)
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return (
    <AuthContext.Provider value={{ sessionInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
