import { useState, useEffect, useRef, useCallback } from 'react'

export function useSpotlight(target: string | null): {
  rect: DOMRect | null
  element: HTMLElement | null
} {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [element, setElement] = useState<HTMLElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mutationObserverRef = useRef<MutationObserver | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const rafRef = useRef<number | null>(null)

  const updateRect = useCallback((el: HTMLElement) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }
    rafRef.current = requestAnimationFrame(() => {
      setRect(el.getBoundingClientRect())
      rafRef.current = null
    })
  }, [])

  useEffect(() => {
    if (!target) {
      setRect(null)
      setElement(null)
      return
    }

    let cancelled = false

    const attach = (el: HTMLElement) => {
      if (cancelled) return

      const viewRect = el.getBoundingClientRect()
      const inView =
        viewRect.top >= 0 &&
        viewRect.left >= 0 &&
        viewRect.bottom <= window.innerHeight &&
        viewRect.right <= window.innerWidth
      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      setElement(el)
      setRect(el.getBoundingClientRect())

      const handleRecalc = () => updateRect(el)

      window.addEventListener('resize', handleRecalc)
      window.addEventListener('scroll', handleRecalc, true)

      resizeObserverRef.current = new ResizeObserver(handleRecalc)
      resizeObserverRef.current.observe(el)

      return () => {
        window.removeEventListener('resize', handleRecalc)
        window.removeEventListener('scroll', handleRecalc, true)
        resizeObserverRef.current?.disconnect()
        resizeObserverRef.current = null
      }
    }

    const found = document.querySelector<HTMLElement>(
      `[data-tour-step="${target}"]`
    )
    let detach: (() => void) | undefined

    if (found) {
      detach = attach(found)
    } else {
      mutationObserverRef.current = new MutationObserver(() => {
        const el = document.querySelector<HTMLElement>(
          `[data-tour-step="${target}"]`
        )
        if (el) {
          mutationObserverRef.current?.disconnect()
          mutationObserverRef.current = null
          detach = attach(el)
        }
      })
      mutationObserverRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      })

      timeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          mutationObserverRef.current?.disconnect()
          mutationObserverRef.current = null
          setRect(null)
          setElement(null)
        }
      }, 3000)
    }

    return () => {
      cancelled = true
      detach?.()
      mutationObserverRef.current?.disconnect()
      mutationObserverRef.current = null
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [target, updateRect])

  return { rect, element }
}
