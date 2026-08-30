import { useEffect, useId, useRef, useState } from 'react'
import { fetchPlaceDetails, fetchPlaceSuggestions } from './places'
import type { PlaceSuggestion } from './places'
import { useCurrentLocation } from './useCurrentLocation'
import type { AnchorPlace } from './types'

type Props = {
  value: string
  onChange: (value: string) => void
  /** Fired once a suggestion is chosen and its details have been resolved. */
  onSelect: (place: AnchorPlace) => void
  id?: string
  placeholder?: string
  required?: boolean
}

const DEBOUNCE_MS = 250
const MIN_QUERY = 3

/**
 * Anchor field backed by the Mappls Auto Suggest API, as an ARIA combobox.
 *
 * Typing stays free-form — the recommendation request only needs the text — but choosing a
 * suggestion also captures its eLoc and confirmed address via the Place Details API.
 */
export function PlaceAutosuggest({ value, onChange, onSelect, id, placeholder, required }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const currentLocation = useCurrentLocation()
  const near = currentLocation.kind === 'located' ? currentLocation.location : undefined
  // Set when a suggestion is chosen, so the resulting value change does not reopen the list.
  const chosenRef = useRef<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = `places-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Look up suggestions for the current text, debounced, with the previous request abandoned.
  useEffect(() => {
    if (chosenRef.current === value) return
    const query = value.trim()
    if (query.length < MIN_QUERY) {
      setSuggestions([]); setStatus('idle'); setOpen(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setStatus('loading')
      fetchPlaceSuggestions(query, near, controller.signal)
        .then((results) => {
          setSuggestions(results); setActive(-1); setStatus('idle')
          setOpen(true)
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setSuggestions([]); setStatus('error'); setOpen(true)
        })
    }, DEBOUNCE_MS)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [value, near])

  // Close when focus or a click lands outside the field.
  useEffect(() => {
    if (!open) return
    const handle = (event: MouseEvent | FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('focusin', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('focusin', handle)
    }
  }, [open])

  function choose(suggestion: PlaceSuggestion) {
    chosenRef.current = suggestion.placeName
    onChange(suggestion.placeName)
    setOpen(false)
    setSuggestions([])
    setActive(-1)
    onSelect({ eLoc: suggestion.eLoc, name: suggestion.placeName, address: suggestion.placeAddress })
    // Confirm the canonical name and full address against Place Details.
    fetchPlaceDetails(suggestion.eLoc)
      .then((details) => {
        if (!details) return
        onSelect({
          eLoc: details.eLoc,
          name: details.name || suggestion.placeName,
          address: details.address || suggestion.placeAddress,
        })
      })
      .catch(() => { /* the suggestion's own fields are enough */ })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { setOpen(false); return }
    if (!open || suggestions.length === 0) {
      if (event.key === 'ArrowDown' && suggestions.length > 0) { setOpen(true); event.preventDefault() }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => (current <= 0 ? suggestions.length : current) - 1)
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      choose(suggestions[active])
    }
  }

  const showList = open && (suggestions.length > 0 || status === 'error')

  return <div className="place-field" ref={rootRef}>
    <input
      id={id}
      value={value}
      onChange={(event) => { chosenRef.current = null; onChange(event.target.value) }}
      onKeyDown={handleKeyDown}
      onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
      placeholder={placeholder}
      required={required}
      autoComplete="off"
      spellCheck={false}
      role="combobox"
      aria-expanded={showList}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
    />
    {status === 'loading' && <span className="place-status" aria-hidden="true">…</span>}
    {showList && <ul className="place-list" id={listId} role="listbox">
      {status === 'error'
        ? <li className="place-empty" role="option" aria-selected="false" aria-disabled="true">Place search is unavailable right now.</li>
        : suggestions.map((suggestion, index) => <li
            key={suggestion.eLoc}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={index === active ? 'is-active' : undefined}
            onMouseEnter={() => setActive(index)}
            onMouseDown={(event) => { event.preventDefault(); choose(suggestion) }}
          >
            <b>{suggestion.placeName}</b>
            <small>{suggestion.placeAddress}</small>
            {near && suggestion.distance != null && <span className="place-distance">{formatDistance(suggestion.distance)}</span>}
          </li>)}
      <li className="place-credit" role="presentation">
        <span>Powered by Mappls</span>
        {currentLocation.kind === 'located'
          ? <span>Aerial distance from your location</span>
          : currentLocation.kind === 'locating' ? <span>Finding your location…</span> : null}
      </li>
    </ul>}
    <span className="sr-only" role="status" aria-live="polite">
      {showList && status !== 'error' ? `${suggestions.length} suggestions available.` : ''}
    </span>
  </div>
}

/** Straight-line distance, in the units a renter would use to judge "how far". */
function formatDistance(metres: number) {
  if (metres < 950) return `${Math.round(metres / 10) * 10} m`
  return `${(metres / 1000).toFixed(metres < 9500 ? 1 : 0)} km`
}
