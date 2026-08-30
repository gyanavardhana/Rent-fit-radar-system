import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { loadMappls, MAPPLS_TOKEN } from './mappls'
import type { MapplsLayer, MapplsMapInstance, MapplsSdk } from './mappls'
import type { GeoPoint, RankedLocality, Recommendation } from './types'

type Props = {
  anchor?: Recommendation['anchor']
  localities: RankedLocality[]
  selected: RankedLocality
  onSelect: (locality: RankedLocality) => void
  /** Rendered on top of the map once it is showing (score orb, caption). */
  overlay?: ReactNode
}

type Status = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; message: string }

const BENGALURU: GeoPoint = { lat: 12.9716, lng: 77.5946 }
const MAP_LOAD_TIMEOUT_MS = 15_000
const MAP_LOAD_FAILED = 'The map did not finish loading. The Mappls token may be invalid, expired, or restricted to another domain.'
const MAP_NO_TOKEN = 'Map unavailable: set VITE_MAPPLS_TOKEN in frontend/.env.local (see .env.example).'

/**
 * Results map: plots the commute anchor and the shortlisted localities with the Mappls Web SDK.
 * The access token is build-time configuration, so there is nothing to enter here.
 */
export function LocalityMap({ anchor, localities, selected, onSelect, overlay }: Props) {
  const [status, setStatus] = useState<Status>(MAPPLS_TOKEN ? { kind: 'loading' } : { kind: 'error', message: MAP_NO_TOKEN })
  const containerId = `mappls-map-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<{ sdk: MapplsSdk; map: MapplsMapInstance } | null>(null)
  const layersRef = useRef<MapplsLayer[]>([])
  const selectedRef = useRef(selected)

  const localityPoints = pointsFor(localities)
  const hasPoints = Boolean(anchor) || localityPoints.length > 0

  // Load the SDK and create the map.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!MAPPLS_TOKEN || !hasPoints || !canvas) return
    let cancelled = false
    let loadTimer = 0
    let loadPoll = 0
    const report = (next: Status) => { if (!cancelled) setStatus(next) }

    loadMappls()
      .then((sdk) => {
        if (cancelled) return
        canvas.innerHTML = ''
        let map: MapplsMapInstance
        try {
          map = new sdk.Map(containerId, {
            center: BENGALURU, zoom: 11, zoomControl: true, fullscreenControl: false,
            traffic: false, scaleControl: false, rotateControl: false, indoor: false,
          })
        } catch (error) {
          report({ kind: 'error', message: error instanceof Error ? error.message : MAP_LOAD_FAILED })
          return
        }
        mapRef.current = { sdk, map }
        const markReady = () => {
          window.clearTimeout(loadTimer)
          window.clearInterval(loadPoll)
          // The SDK sizes its canvas once, from the box it saw at construction. Re-sync as the
          // card settles (web fonts, the taller detail column) or the map keeps its first height.
          for (const delay of [0, 150, 400, 900]) window.setTimeout(() => syncSize(map), delay)
          report({ kind: 'ready' })
        }
        const listen = map.addListener ?? map.on
        listen?.call(map, 'load', markReady)
        loadPoll = window.setInterval(() => { if (map.loaded?.()) markReady() }, 400)
        loadTimer = window.setTimeout(() => report({ kind: 'error', message: MAP_LOAD_FAILED }), MAP_LOAD_TIMEOUT_MS)
      })
      .catch((error: unknown) => report({ kind: 'error', message: error instanceof Error ? error.message : 'Could not load the Mappls SDK.' }))

    return () => {
      cancelled = true
      window.clearTimeout(loadTimer)
      window.clearInterval(loadPoll)
      const current = mapRef.current
      mapRef.current = null
      layersRef.current = []
      try { current?.map.remove?.() } catch { /* SDK teardown is best-effort */ }
      canvas.innerHTML = ''
    }
  }, [hasPoints, containerId])

  // Draw anchor, localities, and commute lines whenever the map or the data changes.
  useEffect(() => {
    const handle = mapRef.current
    const stage = stageRef.current
    if (status.kind !== 'ready' || !handle || !stage) return
    const { sdk, map } = handle
    for (const layer of layersRef.current) {
      try { sdk.remove({ map, layer }) } catch { /* layer already gone */ }
    }
    const layers: MapplsLayer[] = []
    const points = pointsFor(localities)
    const selectedName = selectedRef.current.locality
    const addLayer = (create: () => MapplsLayer) => {
      try { layers.push(create()) } catch (error) { console.warn('Mappls layer skipped', error) }
    }
    if (anchor) {
      for (const point of points) {
        addLayer(() => new sdk.Polyline({ map, path: [anchor.location, point.location], strokeColor: '#1f6b55', strokeOpacity: 0.5, strokeWeight: 2 }))
      }
      addLayer(() => new sdk.Marker({ map, position: anchor.location, html: anchorMarkerHtml(anchor.name), popupHtml: `<div class="rf-popup"><strong>${escapeHtml(anchor.name)}</strong><br>Your commute anchor</div>` }))
    }
    for (const { locality, location } of points) {
      addLayer(() => new sdk.Marker({ map, position: location, html: localityMarkerHtml(locality, locality.locality === selectedName), popupHtml: popupHtml(locality) }))
    }
    layersRef.current = layers
    fitView(map, [...(anchor ? [anchor.location] : []), ...points.map((point) => point.location)], stage)
  }, [status.kind, anchor, localities])

  // Highlight the selected locality's marker.
  useEffect(() => {
    selectedRef.current = selected
    stageRef.current?.querySelectorAll<HTMLElement>('.rf-marker[data-locality]').forEach((element) => {
      element.classList.toggle('is-selected', element.dataset.locality === selected.locality)
    })
  }, [selected, status.kind])

  // Marker clicks select the locality (delegated, so it works however the SDK wraps the marker).
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.rf-marker[data-locality]')
      if (!target) return
      const match = localities.find((locality) => locality.locality === target.dataset.locality)
      if (match) onSelect(match)
    }
    stage.addEventListener('click', handleClick)
    return () => stage.removeEventListener('click', handleClick)
  }, [localities, onSelect])

  // Keep the canvas in sync with layout changes.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || status.kind !== 'ready') return
    const observer = new ResizeObserver(() => { const map = mapRef.current?.map; if (map) syncSize(map) })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [status.kind])

  return <div className="detail-visual">
    <div className="map-stage" ref={stageRef} role="region" aria-label="Map of shortlisted localities">
      {hasPoints
        ? <div className="map-canvas" id={containerId} ref={canvasRef} />
        : <div className="map-state"><p>No map coordinates were returned for these localities yet.</p></div>}
      {hasPoints && status.kind === 'loading' && <div className="map-state"><p>Loading Mappls map…</p></div>}
      {hasPoints && status.kind === 'error' && <div className="map-state error"><p>{status.message}</p></div>}
      {status.kind === 'ready' && overlay && <div className="map-overlay">{overlay}</div>}
    </div>
    <div className="map-footer">
      <span>Mappls{localityPoints.length > 0 && ` · ${localityPoints.length} ${localityPoints.length === 1 ? 'locality' : 'localities'}${anchor ? ' + anchor' : ''}`}</span>
    </div>
  </div>
}

/** Nudges the SDK to re-measure its container. `resize` is the documented hook; the window event
 *  covers builds that only listen for that. */
function syncSize(map: MapplsMapInstance) {
  try { map.resize?.() } catch { /* SDK may not expose resize */ }
}

function pointsFor(localities: RankedLocality[]) {
  return localities.flatMap((locality) => (locality.spatial?.location ? [{ locality, location: locality.spatial.location }] : []))
}

/** Centre and zoom the map so every point is visible, without relying on the SDK's bounds helpers. */
function fitView(map: MapplsMapInstance, points: GeoPoint[], stage: HTMLElement) {
  if (points.length === 0) return
  if (points.length === 1) {
    map.setCenter(points[0])
    map.setZoom(13)
    return
  }
  const WORLD_PIXELS = 512 // Mappls v3 renders with 512px tiles at zoom 0.
  const PADDING = 64
  const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  const lats = points.map((point) => point.lat)
  const lngs = points.map((point) => point.lng)
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)]
  const width = Math.max((stage.clientWidth || 360) - PADDING * 2, 80)
  const height = Math.max((stage.clientHeight || 420) - PADDING * 2, 80)
  const lngFraction = Math.max((maxLng - minLng) / 360, 1e-7)
  const latFraction = Math.max((mercatorY(maxLat) - mercatorY(minLat)) / (2 * Math.PI), 1e-7)
  const zoom = Math.min(Math.log2(width / (WORLD_PIXELS * lngFraction)), Math.log2(height / (WORLD_PIXELS * latFraction)))
  const midY = (mercatorY(minLat) + mercatorY(maxLat)) / 2
  const centerLat = ((2 * Math.atan(Math.exp(midY)) - Math.PI / 2) * 180) / Math.PI
  map.setCenter({ lat: centerLat, lng: (minLng + maxLng) / 2 })
  map.setZoom(Math.round(Math.min(15, Math.max(9, zoom)) * 10) / 10)
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)

function localityMarkerHtml(locality: RankedLocality, isSelected: boolean) {
  const name = escapeHtml(locality.locality)
  return `<div class="rf-marker rf-marker--locality${isSelected ? ' is-selected' : ''}" data-locality="${name}" title="${name}"><span class="rf-marker__badge">0${locality.rank}</span><span class="rf-marker__label">${name}</span></div>`
}

function anchorMarkerHtml(name: string) {
  const safe = escapeHtml(name)
  return `<div class="rf-marker rf-marker--anchor" title="${safe}"><span class="rf-marker__badge">◎</span><span class="rf-marker__label">${safe}</span></div>`
}

function popupHtml(locality: RankedLocality) {
  const commute = locality.spatial?.commute ? `${locality.spatial.commute.durationMinutes} min by ${locality.spatial.commute.mode}` : 'Commute unavailable'
  return `<div class="rf-popup"><strong>${escapeHtml(locality.locality)}</strong><br>Fit ${locality.fitScore}/100 · ${escapeHtml(commute)}</div>`
}
