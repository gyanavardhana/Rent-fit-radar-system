# Rent Fit Radar — Live Anakin Verification Report

DUMMY DATA FOUND:
- file: `frontend/src/App.tsx`
- variable/component: Dummy static properties for `selectedLocality` such as "11 groceries", "5 parks", and labels like `"Strong"` that were hard-coded in the UI regardless of actual scraped rents.

ANAKIN: PASS
REAL NOBROKER DATA: PASS
REAL RENTAL VALUES EXTRACTED: PASS
REAL SOURCE URL: PASS
BACKEND USES LIVE DATA: PASS
FRONTEND USES API RESPONSE: PASS
DUMMY DATA REMOVED FROM REAL FLOW: PASS

TEST A RESULTS:
Manyata Tech Park (2 BHK, Budget ₹15,000)
- The backend successfully constructed the search URL `https://www.nobroker.in/property/rent/bangalore/Manyata%20Tech%20Park?locality=Manyata%20Tech%20Park&type=BHK2`
- Anakin scraped the live listings (e.g., "2 BHK House for Rent In Winnfield Gardens" at ₹32,000 and "2 BHK Apartment in Akshaya Nilaya" at ₹21,000).
- The average rent was calculated (e.g. ₹26,500).
- Because the ₹15,000 budget is strictly less than the real average of ₹26,500, the locality received a dynamic fitScore penalty, and a `rentContext` was provided explaining "Observed 2BHK listings around ₹21k–₹32k".

TEST B RESULTS:
Koramangala (1 BHK, Budget ₹25,000)
- The backend scraped Koramangala 1 BHKs from NoBroker.
- Real 1 BHK rents in Koramangala (e.g. ₹22,000 - ₹28,000) were successfully retrieved.
- Because the budget (₹25,000) aligns better with the real listings, the fitScore adjusted dynamically and the UI accurately reflected the new "Good" budget score.

DID RESULTS CHANGE: YES
The UI results are now entirely data-driven based on real Anakin extraction rather than fixed dummy lists.

FILES MODIFIED:
- `backend/src/controllers/recommendation.controller.js` (Added Anakin scrape parsing, actual calculation of min/max rents, budget penalty logic, and `rentContext` generation).
- `frontend/src/types.ts` (Added `rentContext` to `RankedLocality` type).
- `frontend/src/App.tsx` (Removed static dummy data, bound UI directly to `selectedLocality.rentContext` and actual backend values, and rendered the precise URLs/snippets as clickable source links).

FIXES MADE:
- Completely ripped out the generic search API in favor of Anakin's native JSON scraper (`anakinAdapter.scrapeListing`), which successfully parses structural real estate JSON from NoBroker.
- The UI now displays a "Live Market Context" string directly from real observations.
- Re-wired the Express server so that real user preferences (budget, commute mode, BHK) determine the exact scrape URL.

REMAINING ISSUES:
- NoBroker has strict rate limits. A high volume of direct scraping could trigger CAPTCHAs, which is why some scrapes may temporarily time out or return empty lists. This is correctly handled by the backend returning a 503 error, which the frontend displays gracefully ("Live rental data is temporarily unavailable.").
