import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { setGlobalErrorToast } from '@/modules/database/config/queryClient'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_STYLES = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    message: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-700',
  },
}

const DEFAULT_DURATION = 5000

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast & { visible: boolean }
  onDismiss: (id: string) => void
}) {
  const styles = TOAST_STYLES[toast.type]
  const Icon = TOAST_ICONS[toast.type]

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border-2 border-[#1e293b] ${styles.bg} px-4 py-3 shadow-[3px_3px_0px_0px_#1e293b] transition-all duration-300 min-w-[320px] max-w-[420px] ${
        toast.visible
          ? 'opacity-100 translate-y-0 translate-x-0'
          : 'opacity-0 translate-y-2 translate-x-4'
      }`}
    >
      <Icon className={`h-5 w-5 ${styles.icon} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.title}`}>{toast.title}</p>
        {toast.message && (
          <p className={`text-sm ${styles.message} mt-0.5`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[#64748b] hover:text-[#1e293b] transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { visible: boolean })[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    // Clear timer
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    // Animate out
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)))

    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const duration = toast.duration ?? DEFAULT_DURATION

      const newToast: Toast & { visible: boolean } = {
        ...toast,
        id,
        visible: true,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss
      const timer = setTimeout(() => {
        dismissToast(id)
      }, duration)
      timersRef.current.set(id, timer)
    },
    [dismissToast]
  )

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message })
    },
    [showToast]
  )

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message })
    },
    [showToast]
  )

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message })
    },
    [showToast]
  )

  // Wire up global error toast for React Query mutation errors
  useEffect(() => {
    setGlobalErrorToast(showError)
    return () => setGlobalErrorToast(null)
  }, [showError])

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning }}>
      {children}
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
