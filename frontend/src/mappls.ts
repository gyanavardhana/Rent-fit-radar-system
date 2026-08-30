/**
 * Loader for the Mappls Web SDK (v3.0).
 *
 * The SDK is a classic `<script>` that needs the access token in its URL and defines a
 * global `mappls` namespace. This module injects that script on demand and resolves once
 * `mappls.Map` is usable. The token comes from the build environment, so it never changes
 * at runtime and one injection serves the whole page.
 */

export type MapplsLatLng = { lat: number; lng: number }

export interface MapplsMapInstance {
  setCenter(center: MapplsLatLng): void
  setZoom(zoom: number): void
  getZoom(): number
  resize?(): void
  remove?(): void
  loaded?(): boolean
  addListener?(event: string, handler: (...args: unknown[]) => void): void
  on?(event: string, handler: (...args: unknown[]) => void): void
}

export interface MapplsLayer {
  addListener?(event: string, handler: (...args: unknown[]) => void): void
  remove?(): void
}

export interface MapplsSdk {
  /** Applies one of the account's named styles (see `getStyles`). */
  setStyle?(style: string): void
  getStyles?(callback: (styles: Array<{ name: string; displayName?: string }>) => void): void
  Map: new (container: string | HTMLElement, options: Record<string, unknown>) => MapplsMapInstance
  Marker: new (options: Record<string, unknown>) => MapplsLayer
  Polyline: new (options: Record<string, unknown>) => MapplsLayer
  fitBounds?: new (options: {
    map: MapplsMapInstance
    cType?: 0 | 1
    bounds: Array<[number, number]>
    options?: { padding?: number; duration?: number }
  }) => unknown
  remove(options: { map: MapplsMapInstance; layer: MapplsLayer | MapplsLayer[] }): void
}

declare global {
  interface Window {
    mappls?: MapplsSdk
  }
}

/** Named style from the Mappls console applied to every map this app renders. */
export const MAP_STYLE = 'mappls_jadegreen'

/** Browser key for the Web SDK, from `VITE_MAPPLS_TOKEN` (see `.env.example`). */
export const MAPPLS_TOKEN = String(import.meta.env.VITE_MAPPLS_TOKEN ?? '').trim()

const SDK_URL = 'https://sdk.mappls.com/map/sdk/web'
const SCRIPT_ATTRIBUTE = 'data-mappls-sdk'
const LOAD_TIMEOUT_MS = 20_000

let current: Promise<MapplsSdk> | null = null

/** Loads the SDK. Repeated calls share one promise and one injected script. */
export function loadMappls(): Promise<MapplsSdk> {
  if (current) return current

  const promise = new Promise<MapplsSdk>((resolve, reject) => {
    const callbackName = `__mapplsReady${Date.now().toString(36)}`
    const script = document.createElement('script')
    const globals = window as unknown as Record<string, unknown>
    let settled = false
    let timer = 0
    let poll = 0

    const cleanup = () => {
      window.clearTimeout(timer)
      window.clearInterval(poll)
      delete globals[callbackName]
    }
    const succeed = () => {
      const sdk = window.mappls
      if (settled || !sdk?.Map) return
      settled = true
      cleanup()
      resolve(sdk)
    }
    const fail = (message: string) => {
      if (settled) return
      settled = true
      cleanup()
      script.remove()
      reject(new Error(message))
    }

    globals[callbackName] = succeed
    timer = window.setTimeout(() => fail('Mappls did not initialise. Check that the access token is valid and not expired.'), LOAD_TIMEOUT_MS)
    poll = window.setInterval(succeed, 250)

    script.src = `${SDK_URL}?v=3.0&layer=vector&access_token=${encodeURIComponent(MAPPLS_TOKEN)}&style=${encodeURIComponent(MAP_STYLE)}&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.setAttribute(SCRIPT_ATTRIBUTE, '')
    script.onerror = () => fail('Could not download the Mappls SDK. The token may be invalid, expired, or restricted to another domain.')
    document.head.appendChild(script)
  })

  current = promise
  // A failed load leaves nothing usable behind, so let a remount try again from scratch.
  promise.catch(() => {
    if (current === promise) {
      document.querySelectorAll(`script[${SCRIPT_ATTRIBUTE}]`).forEach((element) => element.remove())
      delete window.mappls
      current = null
    }
  })
  return promise
}
