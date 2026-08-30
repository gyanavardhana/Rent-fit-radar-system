export type Preferences = {
  anchor: string
  radiusKm: number
  homeType: string
  budgetMax: number
  commuteMode: 'car' | 'transit' | 'bike'
  priorities: string[]
  language: 'en-IN' | 'hi-IN' | 'kn-IN'
}

export type RankedLocality = {
  rank: number
  locality: string
  fitScore: number
  labels: { budget: 'Strong' | 'Good' | 'Mixed' | 'Weak'; commute: 'Strong' | 'Good' | 'Mixed' | 'Weak'; essentials: 'Strong' | 'Good' | 'Mixed' | 'Weak' }
  whyItFits: string
  tradeOff: string
  sources: Array<{ title: string; url: string; snippet: string }>
  spatial?: { mapsUri: string; nearby: Array<{ category: string; count: number }>; commute?: { mode: string; durationMinutes: number; observedAt: string } }
}

export type Recommendation = {
  winner: RankedLocality
  rankedLocalities: RankedLocality[]
  explanation: string
  language: string
  generatedAt: string
}
