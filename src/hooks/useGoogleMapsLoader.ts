import { useState, useEffect, useRef } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let configured = false

export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setLoadError(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'))
      return
    }

    if (!configured) {
      setOptions({ key: apiKey })
      configured = true
    }

    loadedRef.current = true

    importLibrary('places')
      .then(() => {
        setIsLoaded(true)
      })
      .catch((err: Error) => {
        setLoadError(err)
        loadedRef.current = false
      })
  }, [])

  return { isLoaded, loadError }
}
