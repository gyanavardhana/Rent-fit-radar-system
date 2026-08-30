import { useState } from 'react'
import type { FormEvent } from 'react'
import { getRecommendations } from './api'
import { LocalityMap } from './LocalityMap'
import { PlaceAutosuggest } from './PlaceAutosuggest'
import type { Preferences, RankedLocality, Recommendation } from './types'
import './App.css'

const initialPreferences: Preferences = {
  anchor: 'Manyata Tech Park', radiusKm: 5, homeType: '2 BHK', budgetMax: 15000,
  commuteMode: 'car', priorities: ['Metro access', 'Groceries', 'Quiet streets'], language: 'en-IN',
}
const priorityOptions = ['Metro access', 'Groceries', 'Parks', 'Hospitals', 'Quiet streets']

function App() {
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [selectedLocality, setSelectedLocality] = useState<RankedLocality | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showConversation, setShowConversation] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); 
    console.log("[Frontend] submitting preferences", preferences);
    setIsLoading(true);
    setErrorMsg(null);
    setRecommendation(null);
    setSelectedLocality(null);
    try {
      const result = await getRecommendations(preferences)
      console.log("[Frontend] API response received", result);
      setRecommendation(result); 
      setSelectedLocality(result.winner); 
      console.log("[Frontend] rendered recommendations:", result.rankedLocalities.length);
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }
  
  function togglePriority(priority: string) {
    setPreferences((current) => ({ ...current, priorities: current.priorities.includes(priority)
      ? current.priorities.filter((item) => item !== priority) : [...current.priorities, priority] }))
  }
  return <main>
    <nav className="topbar">
      <a className="brand" href="#top"><span className="brand-mark">R</span><span>Rent Fit <b>Radar</b></span></a>
      <span className="location-tag">Bengaluru <span>•</span> Smart renting</span>
    </nav>
    <section className="hero" id="top">
      <div className="eyebrow"><span className="pulse" /> Your next locality, made clearer</div>
      <h1>Find a place that <em>fits your life.</em></h1>
      <p className="hero-copy">Compare Bengaluru localities around rent, commute, everyday essentials, and peace of mind.</p>
    </section>
    <section className="planner-shell" aria-label="Rental preferences">
      <div className="step-label">01 <span>Your search</span></div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid top-fields">
          <label><span>Where do you need to be?</span><PlaceAutosuggest
            value={preferences.anchor}
            onChange={(anchor) => setPreferences((current) => ({ ...current, anchor, anchorPlace: undefined }))}
            onSelect={(anchorPlace) => setPreferences((current) => ({ ...current, anchor: anchorPlace.name, anchorPlace }))}
            placeholder="e.g. Manyata Tech Park"
            required
          /></label>
          <label><span>Search radius</span><select value={preferences.radiusKm} onChange={(event) => setPreferences({ ...preferences, radiusKm: Number(event.target.value) })}><option value={3}>Within 3 km</option><option value={5}>Within 5 km</option><option value={8}>Within 8 km</option><option value={12}>Within 12 km</option></select></label>
        </div>
        <div className="form-grid">
          <fieldset><legend>Home type</legend><div className="segmented">{['1 BHK', '2 BHK', '3 BHK'].map((type) => <button className={preferences.homeType === type ? 'active' : ''} key={type} onClick={() => setPreferences({ ...preferences, homeType: type })} type="button">{type}</button>)}</div></fieldset>
          <label><span>Monthly rent ceiling</span><div className="money-input"><span>₹</span><input type="number" min="5000" step="1000" value={preferences.budgetMax} onChange={(event) => setPreferences({ ...preferences, budgetMax: Number(event.target.value) })} /></div></label>
        </div>
        <div className="form-grid">
          <fieldset><legend>How do you usually commute?</legend><div className="mode-options">{[['car', '🚗', 'Drive'], ['transit', '🚇', 'Metro / bus'], ['bike', '🏍️', 'Two-wheeler']].map(([value, icon, label]) => <button className={preferences.commuteMode === value ? 'mode active' : 'mode'} key={value} type="button" onClick={() => setPreferences({ ...preferences, commuteMode: value as Preferences['commuteMode'] })}><span>{icon}</span>{label}</button>)}</div></fieldset>
          <fieldset><legend>Results language</legend><div className="segmented language">{[['en-IN', 'English'], ['hi-IN', 'हिंदी'], ['kn-IN', 'ಕನ್ನಡ']].map(([value, label]) => <button className={preferences.language === value ? 'active' : ''} key={value} type="button" onClick={() => setPreferences({ ...preferences, language: value as Preferences['language'] })}>{label}</button>)}</div></fieldset>
        </div>
        <fieldset className="priorities"><legend>What should the locality make easier?</legend><p>Selected: {preferences.priorities.join(', ') || 'Choose what matters'}</p><div className="chip-list">{priorityOptions.map((priority) => <button className={preferences.priorities.includes(priority) ? 'chip selected' : 'chip'} key={priority} onClick={() => togglePriority(priority)} type="button">{preferences.priorities.includes(priority) && '✓ '}{priority}</button>)}</div></fieldset>
        <button className="primary-cta" type="submit" disabled={isLoading}>{isLoading ? 'Searching live rental data...' : 'Find my best-fit localities'} <span>→</span></button>
        <p className="privacy-note">We use your preferences only to create this comparison. No phone numbers are requested or exposed.</p>
      </form>
    </section>
    
    {errorMsg && (
      <section className="results error-state" style={{ textAlign: "center", padding: "40px", color: "red" }}>
        <p><strong>{errorMsg}</strong></p>
      </section>
    )}

    {recommendation && recommendation.rankedLocalities.length === 0 && (
      <section className="results empty-state" style={{ textAlign: "center", padding: "40px" }}>
        <p><strong>No strong matches found for these preferences.</strong></p>
        <p>Consider broadening your budget, search radius, or commute tolerance.</p>
      </section>
    )}

    {recommendation && selectedLocality && <section className="results" aria-live="polite">
      <div className="results-intro"><div><div className="step-label">02 <span>Your shortlist</span></div><h2>Three places worth your attention.</h2></div><p>Live indicators are a snapshot, not a promise. Always verify the exact property before signing.</p></div>
      <div className="result-layout">
        <div className="rank-list">{recommendation.rankedLocalities.map((locality) => <button className={selectedLocality.locality === locality.locality ? 'locality-row selected' : 'locality-row'} key={locality.locality} onClick={() => setSelectedLocality(locality)}><span className="rank">0{locality.rank}</span><span className="locality-name">{locality.locality}<small>{locality.whyItFits}</small></span><span className="score">{locality.fitScore}<small>fit</small></span></button>)}</div>
        <article className="detail-card">
          <LocalityMap anchor={recommendation.anchor} localities={recommendation.rankedLocalities} selected={selectedLocality} onSelect={setSelectedLocality} overlay={<div className="map-badge"><div className="score-orb"><strong>{selectedLocality.fitScore}</strong><span>FIT SCORE</span></div><p className="map-caption">{selectedLocality.locality} <span>•</span> {selectedLocality.rank === 1 ? 'Best overall match' : `Ranked #${selectedLocality.rank}`}</p></div>} />
          <div className="detail-body">
            <div className="label-row"><span className="best-match">Best match</span><span>Live data</span></div>
            <h3>{selectedLocality.locality}</h3>
            
            {selectedLocality.rentContext && (
              <p className="why" style={{ color: "var(--brand)" }}><strong>Live Market Context:</strong> {selectedLocality.rentContext}</p>
            )}
            
            <p className="why">{selectedLocality.whyItFits}</p>
            
            <div className="metric-grid"><Metric label="Budget" value={selectedLocality.labels.budget} icon="₹" /><Metric label="Commute" value={selectedLocality.spatial?.commute ? selectedLocality.spatial.commute.durationMinutes + ' min' : 'Unavailable'} icon="↗" /><Metric label="Essentials" value={selectedLocality.labels.essentials} icon="✦" /></div>
            <div className="tradeoff"><b>Worth knowing</b><p>{selectedLocality.tradeOff}</p></div>
            <div className="nearby"><span>Nearby</span>{selectedLocality.spatial?.nearby.map((item) => <b key={item.category}>{item.count} {item.category}</b>)}</div>
            
            {selectedLocality.sources && selectedLocality.sources.length > 0 && (
              <div className="sources-area" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <b style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "var(--fg-muted)" }}>Evidence-backed by:</b>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flexDirection: "column" }}>
                  {selectedLocality.sources.map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "var(--brand)", textDecoration: "underline", display: "block" }}>
                      {src.title.length > 60 ? src.title.slice(0, 60) + "..." : src.title}
                      <span style={{ display: "block", color: "var(--fg-muted)", fontSize: "11px", textDecoration: "none" }}>{src.snippet}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="detail-actions"><a href={selectedLocality.spatial?.mapsUri} target="_blank" rel="noreferrer">Open in Maps ↗</a><button onClick={() => setShowConversation(true)} type="button">Start bilingual conversation</button></div>
          </div>
        </article>
      </div>
    </section>}
    {showConversation && <ConversationModal onClose={() => setShowConversation(false)} />}
  </main>
}
function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <div className="metric"><span>{icon}</span><small>{label}</small><b>{value}</b></div>
}
function ConversationModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="conversation-modal" role="dialog" aria-modal="true" aria-labelledby="conversation-title" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="Close">×</button><div className="conversation-icon">◌</div><p className="eyebrow">Bilingual call room</p><h2 id="conversation-title">Talk comfortably, in your own language.</h2><p>Each short turn is translated and spoken for the other participant. Both people must join and agree before the room opens.</p><div className="consent"><b>AI translation notice</b><span>Your voice is used only to translate this conversation. Recording and transcript saving are off by default.</span></div><label className="consent-check"><input type="checkbox" /> I understand and agree to use AI translation.</label><button className="primary-cta" type="button">Create a private invite <span>→</span></button><small>No contact details are revealed by Rent Fit Radar.</small></section></div>
}
export default App
