// TEMPORARY smoke harness (not part of the app): renders the results detail card with an inline copy
// of the fixture so the LocalityMap states can be checked in a headless browser without waiting on
// the API fallback delay. The map token comes from VITE_MAPPLS_TOKEN, same as the app.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import { LocalityMap } from './LocalityMap'
import type { RankedLocality, Recommendation } from './types'

// Mirrors the client fallback in api.ts, inline so the harness renders immediately.
const at = new Date().toISOString()
const base: RankedLocality = {
  rank: 1, locality: 'Thanisandra', fitScore: 91,
  labels: { budget: 'Strong', commute: 'Strong', essentials: 'Strong' },
  whyItFits: 'A balanced match for a 2 BHK near Manyata, with practical everyday access.',
  tradeOff: 'Peak-hour road traffic can add time, so favour homes closer to your work corridor.',
  sources: [],
  spatial: { mapsUri: 'https://www.google.com/maps/search/?api=1&query=Thanisandra%2C+Bengaluru', location: { lat: 13.0565, lng: 77.6284 }, nearby: [{ category: 'groceries', count: 14 }, { category: 'parks', count: 5 }], commute: { mode: 'car', durationMinutes: 18, observedAt: at } },
}
const fixture: Recommendation = {
  winner: base, language: 'en-IN', generatedAt: at,
  anchor: { name: 'Manyata Tech Park', location: { lat: 13.0449, lng: 77.6203 } },
  explanation: 'Client fixture until the recommendation API is connected.',
  rankedLocalities: [
    base,
    { ...base, rank: 2, locality: 'Hebbal', fitScore: 85, labels: { budget: 'Good', commute: 'Strong', essentials: 'Strong' }, whyItFits: 'Fast access to the tech corridor and well-served everyday infrastructure.', tradeOff: 'Higher demand means the better-priced listings move quickly.', spatial: { ...base.spatial!, mapsUri: 'https://www.google.com/maps/search/?api=1&query=Hebbal%2C+Bengaluru', location: { lat: 13.0358, lng: 77.597 }, commute: { mode: 'car', durationMinutes: 14, observedAt: at } } },
    { ...base, rank: 3, locality: 'Hennur', fitScore: 78, labels: { budget: 'Strong', commute: 'Good', essentials: 'Good' }, whyItFits: 'More room in the budget while staying connected to north Bengaluru.', tradeOff: 'Last-mile transport varies more by the exact street.', spatial: { ...base.spatial!, mapsUri: 'https://www.google.com/maps/search/?api=1&query=Hennur%2C+Bengaluru', location: { lat: 13.0301, lng: 77.6419 }, commute: { mode: 'car', durationMinutes: 25, observedAt: at } } },
  ],
}

function Smoke() {
  const [selected, setSelected] = useState<RankedLocality>(fixture.winner)
  return <main>
    <section className="results" style={{ paddingTop: 24 }}>
      <div className="result-layout">
        <div className="rank-list">{fixture.rankedLocalities.map((locality) => <button className={selected.locality === locality.locality ? 'locality-row selected' : 'locality-row'} key={locality.locality} onClick={() => setSelected(locality)}><span className="rank">0{locality.rank}</span><span className="locality-name">{locality.locality}</span><span className="score">{locality.fitScore}</span></button>)}</div>
        <article className="detail-card">
          <LocalityMap anchor={fixture.anchor} localities={fixture.rankedLocalities} selected={selected} onSelect={setSelected} overlay={<div className="map-badge"><div className="score-orb"><strong>{selected.fitScore}</strong><span>FIT SCORE</span></div><p className="map-caption">{selected.locality} <span>•</span> Best overall match</p></div>} />
          <div className="detail-body"><h3>{selected.locality}</h3><p className="why">{selected.whyItFits}</p></div>
        </article>
      </div>
    </section>
  </main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><Smoke /></StrictMode>)
