import { useEffect, useState } from 'react'
import type { GeoPoint } from './types'

type State =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'located'; location: GeoPoint }
  | { kind: 'unavailable' }

const OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }

/**
 * The renter's current position, asked for once.
 *
 * Used to bias place search and to report how far each suggestion is. Every failure path —
 * no support, insecure context, permission denied, timeout — lands on `unavailable`, and
 * callers fall back to the city-wide default.
 */
export function useCurrentLocation(): State {
  const [state, setState] = useState<State>({ kind: 'idle' })

  useEffect(() => {
    if (!('geolocation' in navigator)) { setState({ kind: 'unavailable' }); return }
    let cancelled = false
    setState({ kind: 'locating' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        setState({ kind: 'located', location: { lat: position.coords.latitude, lng: position.coords.longitude } })
      },
      () => { if (!cancelled) setState({ kind: 'unavailable' }) },
      OPTIONS,
    )
    return () => { cancelled = true }
  }, [])

  return state
}
