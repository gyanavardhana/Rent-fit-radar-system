import type { GeoPoint } from './types'

/**
 * Mappls place lookups, via the app's own `/api/places/*` routes.
 *
 * Autosuggest is proxied because `search.mappls.com` sends no CORS header; the proxy adds the
 * access token (see the `mappls-places` plugin in vite.config.ts).
 */

export type PlaceSuggestion = {
  eLoc: string
  placeName: string
  placeAddress: string
  type: string
/** Straight-line metres from the search bias point, when the API reports it. */
  distance?: number
}

export type PlaceDetails = {
  eLoc: string
  name: string
  address: string
}

type SuggestResponse = {
  suggestedLocations?: Array<Partial<PlaceSuggestion>>
}

/**
 * Suggestions for `query`, ranked around `near` when the renter's position is known.
 * Returns [] for short queries; throws only on a transport failure.
 */
export async function fetchPlaceSuggestions(query: string, near?: GeoPoint, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  const params = new URLSearchParams({ q: trimmed })
  if (near) params.set('location', `${near.lat},${near.lng}`)
  const response = await fetch(`/api/places/autosuggest?${params}`, { signal })
  if (!response.ok) throw new Error(`Place search unavailable (${response.status})`)
  const data = (await response.json()) as SuggestResponse
  return (data.suggestedLocations ?? [])
    .filter((item): item is PlaceSuggestion => Boolean(item.eLoc && item.placeName))
    .map((item) => ({
      eLoc: item.eLoc, placeName: item.placeName, placeAddress: item.placeAddress ?? '',
      type: item.type ?? 'PLACE', distance: item.distance,
    }))
}

/** Canonical name and address for a selected suggestion, from the Place Details API. */
export async function fetchPlaceDetails(eLoc: string, signal?: AbortSignal): Promise<PlaceDetails | null> {
  const response = await fetch(`/api/places/details/${encodeURIComponent(eLoc)}`, { signal })
  if (!response.ok) return null
  const data = (await response.json()) as Record<string, unknown>
  return {
    eLoc: String(data.eloc ?? data.eLoc ?? eLoc),
    name: String(data.name ?? ''),
    address: String(data.address ?? ''),
  }
}
