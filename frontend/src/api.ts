import type { Preferences, Recommendation } from './types'

const now = () => new Date().toISOString()
const winner = (): Recommendation['winner'] => ({
  rank: 1, locality: 'Thanisandra', fitScore: 91,
  labels: { budget: 'Strong', commute: 'Strong', essentials: 'Strong' },
  whyItFits: 'A balanced match for a 2 BHK near Manyata, with practical everyday access.',
  tradeOff: 'Peak-hour road traffic can add time, so favour homes closer to your work corridor.',
  sources: [],
  spatial: { mapsUri: 'https://www.google.com/maps/search/?api=1&query=Thanisandra%2C+Bengaluru', nearby: [{ category: 'groceries', count: 14 }, { category: 'parks', count: 5 }], commute: { mode: 'car', durationMinutes: 18, observedAt: now() } },
})

function fallback(language: string): Recommendation {
  const first = winner()
  return {
    winner: first, language, generatedAt: now(), explanation: 'Client fixture until the recommendation API is connected.',
    rankedLocalities: [
      first,
      { ...first, rank: 2, locality: 'Hebbal', fitScore: 85, labels: { budget: 'Good', commute: 'Strong', essentials: 'Strong' }, whyItFits: 'Fast access to the tech corridor and well-served everyday infrastructure.', tradeOff: 'Higher demand means the better-priced listings move quickly.', spatial: { ...first.spatial!, mapsUri: 'https://www.google.com/maps/search/?api=1&query=Hebbal%2C+Bengaluru', commute: { mode: 'car', durationMinutes: 14, observedAt: now() } } },
      { ...first, rank: 3, locality: 'Hennur', fitScore: 78, labels: { budget: 'Strong', commute: 'Good', essentials: 'Good' }, whyItFits: 'More room in the budget while staying connected to north Bengaluru.', tradeOff: 'Last-mile transport varies more by the exact street.', spatial: { ...first.spatial!, mapsUri: 'https://www.google.com/maps/search/?api=1&query=Hennur%2C+Bengaluru', commute: { mode: 'car', durationMinutes: 25, observedAt: now() } } },
    ],
  }
}

export async function getRecommendations(preferences: Preferences): Promise<Recommendation> {
  try {
    const response = await fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences) })
    if (!response.ok) throw new Error('Recommendation API unavailable')
    return response.json() as Promise<Recommendation>
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 650))
    return fallback(preferences.language)
  }
}
