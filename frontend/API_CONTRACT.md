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
- No API keys, raw owner/renter phone numbers, or private listing data.

Until this endpoint exists, the frontend displays a clearly local fallback fixture.

## Bilingual conversation (next integration)

The current modal is UI-only. Wire its primary action to:

`POST /api/conversations`

with accepted translation notice and the renter's language. The backend returns a short-lived invite / room token. The follow-on room uses:

- `POST /api/conversations/:id/join`
- `POST /api/conversations/:id/turn`

Use short consented audio turns only; recordings and transcripts are not persisted by default.
