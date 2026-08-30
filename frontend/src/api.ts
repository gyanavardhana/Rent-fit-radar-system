import type { Preferences, Recommendation } from './types'

export async function getRecommendations(preferences: Preferences): Promise<Recommendation> {
  const response = await fetch('http://localhost:5000/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  })
  if (!response.ok) {
    let errorMsg = 'Live rental data is temporarily unavailable';
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch (e) {
      // Ignore JSON parse errors for 500 pages
    }
    throw new Error(errorMsg)
  }
  return response.json() as Promise<Recommendation>
}
