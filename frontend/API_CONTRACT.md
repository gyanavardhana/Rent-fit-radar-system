# Frontend API contract

## Recommendations

`POST /api/recommendations`

The frontend sends a JSON `Preferences` object:

```json
{
  "anchor": "Manyata Tech Park",
  "radiusKm": 5,
  "homeType": "2 BHK",
  "budgetMax": 30000,
  "commuteMode": "car",
  "priorities": ["Metro access", "Groceries", "Quiet streets"],
  "language": "en-IN"
}
```

Return JSON matching `Recommendation` in [src/types.ts](src/types.ts). The UI needs:

- Exactly up to three `rankedLocalities`, already ranked (rank starts at 1).
- `winner` to reference the first/best locality.
- Per-locality budget, commute, and essentials labels.
- Optional `spatial.commute.durationMinutes`, `spatial.nearby`, and a safe public `spatial.mapsUri`.
- Optional `spatial.location` (`{ "lat": 13.0565, "lng": 77.6284 }`, the locality centroid) and a
  top-level `anchor` (`{ "name": "Manyata Tech Park", "location": { "lat": 13.0449, "lng": 77.6203 } }`,
  the resolved commute anchor). The results map plots whatever has coordinates; localities without
  `spatial.location` are simply left off the map.
- No API keys, raw owner/renter phone numbers, or private listing data.

Until this endpoint exists, the frontend displays a clearly local fallback fixture.

## Results map (Mappls Web SDK)

The map in the results detail card is rendered in the browser with the
[Mappls Web SDK](https://github.com/mappls-api/mappls-web-maps-js) and needs a Mappls
**browser** access token — a domain-restricted key from the Mappls console, not a server secret.
The token never travels through this API: it is supplied at build time via `VITE_MAPPLS_TOKEN`
(see `.env.example`) and read from the bundle by the map component. There is no in-app entry.

## Place lookup routes (needed by the frontend)

The anchor field calls these; the dev server implements them by proxying Mappls with the access
token attached. Production must serve the same paths.

`GET /api/places/autosuggest?q=<text>&location=<lat,lng>` → the Mappls Auto Suggest payload,
i.e. `{ suggestedLocations: [{ eLoc, placeName, placeAddress, type, distance }] }`. `distance` is
straight-line metres from `location`, which the client sets to the renter's position when allowed.

`GET /api/places/details/<eLoc>` → `{ eloc, name, address }` from the Place Details API.

Note: on the current Mappls plan neither response carries latitude/longitude (coordinates are a
premium sub-template), so a selected place contributes its name, address, and eLoc only.

## Bilingual conversation (next integration)

The current modal is UI-only. Wire its primary action to:

`POST /api/conversations`

with accepted translation notice and the renter's language. The backend returns a short-lived invite / room token. The follow-on room uses:

- `POST /api/conversations/:id/join`
- `POST /api/conversations/:id/turn`

Use short consented audio turns only; recordings and transcripts are not persisted by default.
