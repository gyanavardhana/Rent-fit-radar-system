/** A place chosen from Mappls Auto Suggest, confirmed against the Place Details API. */
export type AnchorPlace = {
  eLoc: string
  name: string
  address: string
}

export type Preferences = {
  anchor: string
  /** Set when the anchor came from a suggestion rather than free text. */
  anchorPlace?: AnchorPlace
  radiusKm: number
  homeType: string
  budgetMax: number
  commuteMode: 'car' | 'transit' | 'bike'
  priorities: string[]
  language: 'en-IN' | 'hi-IN' | 'kn-IN'
}

export type GeoPoint = { lat: number; lng: number }

export type RankedLocality = {
  rank: number
  locality: string
  fitScore: number
  labels: { budget: 'Strong' | 'Good' | 'Mixed' | 'Weak'; commute: 'Strong' | 'Good' | 'Mixed' | 'Weak'; essentials: 'Strong' | 'Good' | 'Mixed' | 'Weak' }
  whyItFits: string
  tradeOff: string
  rentContext?: string
  sources: Array<{ title: string; url: string; snippet: string }>
  spatial?: {
    mapsUri: string
    /** Locality centroid; when present the results map plots this locality. */
    location?: GeoPoint
    nearby: Array<{ category: string; count: number }>
    commute?: { mode: string; durationMinutes: number; observedAt: string }
  }
}

export type Recommendation = {
  winner: RankedLocality
  rankedLocalities: RankedLocality[]
  explanation: string
  language: string
  generatedAt: string
  /** Resolved commute anchor; when present the results map shows it alongside the localities. */
  anchor?: { name: string; location: GeoPoint }
}
