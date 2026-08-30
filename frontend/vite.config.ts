import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'
import type { ServerResponse } from 'node:http'

const AUTOSUGGEST_URL = 'https://search.mappls.com/search/places/autosuggest/json'
const PLACE_DETAILS_URL = 'https://place.mappls.com/O2O/entity/place-details'
/** Biases suggestions towards the city this MVP covers. */
const DEFAULT_LOCATION = '12.9716,77.5946'

/**
 * Mappls place lookups for the anchor field.
 *
 * `search.mappls.com` sends no `Access-Control-Allow-Origin`, so the browser cannot call
 * autosuggest directly — this proxies it (and place details, for symmetry) and adds the
 * access token server-side. A real backend needs to expose the same two routes in production.
 */
function mapplsPlaces(token: string): Plugin {
  const json = (res: ServerResponse, status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }

  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (!url.pathname.startsWith('/api/places/')) return next()
    if (!token) return json(res, 503, { error: 'not_configured', message: 'Set VITE_MAPPLS_TOKEN in .env.local to enable place search.' })

    const upstream = (() => {
      if (url.pathname === '/api/places/autosuggest') {
        const query = (url.searchParams.get('q') ?? '').trim()
        if (!query) return null
        const target = new URL(AUTOSUGGEST_URL)
        target.searchParams.set('query', query)
        target.searchParams.set('location', url.searchParams.get('location') || DEFAULT_LOCATION)
        target.searchParams.set('bridge', '')
        target.searchParams.set('access_token', token)
        return target
      }
      const details = url.pathname.match(/^\/api\/places\/details\/([A-Za-z0-9]{1,12})$/)
      if (details) {
        const target = new URL(`${PLACE_DETAILS_URL}/${details[1]}`)
        target.searchParams.set('access_token', token)
        return target
      }
      return null
    })()

    if (!upstream) return json(res, 400, { error: 'bad_request', message: 'Unknown place lookup.' })

    fetch(upstream, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const text = await response.text()
        if (!response.ok) return json(res, response.status === 401 ? 502 : response.status, { error: 'upstream_error', message: text.slice(0, 200) })
        try {
          json(res, 200, JSON.parse(text))
        } catch {
          json(res, 502, { error: 'bad_upstream_json', message: text.slice(0, 200) })
        }
      })
      .catch((error: unknown) => json(res, 502, { error: 'upstream_unreachable', message: error instanceof Error ? error.message : 'Mappls could not be reached.' }))
  }

  return {
    name: 'mappls-places',
    configureServer: (server) => { server.middlewares.use(handler) },
    configurePreviewServer: (server) => { server.middlewares.use(handler) },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), mapplsPlaces(env.VITE_MAPPLS_TOKEN ?? '')],
    server: {
      // Plugin middleware runs before Vite's internal proxy, so /api/places/* is answered by
      // mappls-places above and everything else (/api/recommendations) reaches the backend.
      proxy: { '/api': 'http://localhost:5000' },
    },
  }
})
