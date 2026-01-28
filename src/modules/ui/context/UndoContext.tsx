import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface UndoItem {
  id: string
  type: 'appointment' | 'pet' | 'client' | 'groomer' | 'service'
  label: string
  data: unknown
  onUndo: () => Promise<void>
}

interface UndoContextType {
  showUndo: (item: Omit<UndoItem, 'id'>) => void
}

const UndoContext = createContext<UndoContextType | null>(null)

export function UndoProvider({ children }: { children: ReactNode }) {
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
    // Wait for animation before clearing item
    setTimeout(() => setUndoItem(null), 300)
  }, [])

  const showUndo = useCallback((item: Omit<UndoItem, 'id'>) => {
    // Clear any existing undo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const newItem: UndoItem = {
      ...item,
      id: Date.now().toString(),
    }

    setUndoItem(newItem)
    setIsVisible(true)

    // Auto-dismiss after 5 seconds
    timeoutRef.current = setTimeout(() => {
      clearUndo()
    }, 5000)
  }, [clearUndo])

  const handleUndo = useCallback(async () => {
    if (!undoItem) return

    try {
      await undoItem.onUndo()
    } catch (error) {
      console.error('Failed to undo:', error)
    }
    clearUndo()
  }, [undoItem, clearUndo])

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}
      {/* Undo Toast */}
      {undoItem && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-4 rounded-xl border-2 border-[#1e293b] bg-[#1e293b] px-4 py-3 shadow-[4px_4px_0px_0px_#000] text-white">
            <span className="text-sm">
              <span className="font-semibold">{undoItem.label}</span> deleted
            </span>
            <button
              onClick={handleUndo}
              className="rounded-lg bg-white px-3 py-1 text-sm font-semibold text-[#1e293b] transition-all hover:bg-gray-100 active:scale-95"
            >
              Undo
            </button>
            <button
              onClick={clearUndo}
              className="text-gray-400 hover:text-white"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </UndoContext.Provider>
  )
}

export function useUndo() {
  const context = useContext(UndoContext)
  if (!context) {
    throw new Error('useUndo must be used within UndoProvider')
  }
  return context
}
