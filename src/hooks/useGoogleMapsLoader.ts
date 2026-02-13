import { useState, useEffect, useRef } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let configured = false

function getInitialLoadError(): Error | null {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return apiKey ? null : new Error('VITE_GOOGLE_MAPS_API_KEY is not set')
}

export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(getInitialLoadError)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
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
