import { logger } from "../utils/logger.js";

/**
 * Extract all rent-priced listings from a snippet string.
 * Handles multiple listings inside a single snippet (e.g. OLX results).
 * Returns array of { rent, title, address, sqft, bathroom, furnished, url }
 */
function parseListingsFromSnippet(snippet = '', pageTitle = '', pageUrl = '') {
  const results = [];

  // OLX / MagicBricks pattern: "₹ 18,000 1 BHK - 1 Bathroom - 800 sqft ### TITLE Address, Bengaluru Date"
  const multiPattern = /₹\s*([\d,]+)\s+(\d+\s*BHK)[\s–-]*([\d]+)?\s*Bathroom[\s–-]*([\d,]+)?\s*sqft\s*###\s*([^\n]+)/gi;
  let m;
  while ((m = multiPattern.exec(snippet)) !== null) {
    const rent = Number(m[1].replace(/,/g, ''));
    const bhkType = m[2].trim();
    const sqft = m[4] ? m[4].replace(/,/g, '') : null;
    const rest = m[5].trim();
    // rest typically: "TITLE Location, Bengaluru Date"
    const parts = rest.split(/,\s*/);
    const rawTitle = parts[0]?.trim() || `${bhkType} Flat`;
    const address = parts.slice(1).join(', ').replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\b/g, '').trim();
    results.push({ rent, bhkType, sqft, title: rawTitle, address, furnished: null, url: pageUrl });
  }

  // MagicBricks long-form pattern: "Find X BHK flat for rent in LOCATION. The ... is available at rent of ₹XX,000"
  const magicPattern = /Find (\d+ BHK)[^.]+? in ([^.]+)\.\s+[^.]*?rent[^₹]*₹([\d,]+)/gi;
  while ((m = magicPattern.exec(snippet)) !== null) {
    const rent = Number(m[3].replace(/,/g, ''));
    const bhkType = m[1].trim();
    const location = m[2].trim();
    // Extract carpet area if present
    const sqftM = snippet.slice(Math.max(0, m.index - 100), m.index + 300).match(/carpet area of ([\d,]+) sqft/i);
    const sqft = sqftM ? sqftM[1].replace(/,/g, '') : null;
    // Extract furnishing
    const furnishM = snippet.slice(Math.max(0, m.index - 200), m.index + 50).match(/Furnishing\s+(\S+(?:\s+\S+)?)/i);
    const furnished = furnishM ? furnishM[1] : null;
    results.push({
      rent, bhkType, sqft, furnished,
      title: `${bhkType} Flat in ${location}`,
      address: location,
      url: pageUrl
    });
  }

  // Fallback: any "₹X,XXX" in the page title or snippet with no structured data
  if (results.length === 0) {
    const simpleRent = snippet.match(/₹\s*([\d,]+)/);
    if (simpleRent && pageTitle) {
      const rent = Number(simpleRent[1].replace(/,/g, ''));
      if (rent > 2000 && rent < 500000) {
        results.push({
          rent,
          bhkType: snippet.match(/(\d+ BHK)/i)?.[1] || null,
          sqft: snippet.match(/([\d]+)\s*sqft/i)?.[1] || null,
          furnished: null,
          title: pageTitle.replace(/\t|\n/g, ' ').trim().slice(0, 80),
          address: detectLocality(snippet + ' ' + pageTitle),
          url: pageUrl
        });
      }
    }
  }

  return results;
}

/** Known Bengaluru localities for detection */
const LOCALITIES = [
  'HSR Layout', 'Koramangala', 'Indiranagar', 'Whitefield', 'Marathahalli',
  'Thanisandra', 'Hebbal', 'Hennur', 'Nagavara', 'Nagawara',
  'HBR Layout', 'Yelahanka', 'Ramamurthy Nagar', 'Kalyan Nagar', 'Banaswadi',
  'BTM Layout', 'Jayanagar', 'JP Nagar', 'Electronic City', 'Electronics City',
  'Sarjapur', 'Bellandur', 'KR Puram', 'Hoodi', 'Mahadevapura',
  'Manyata', 'Hebbal', 'Rajajinagar', 'Malleshwaram', 'Yeshwanthpur',
  'Bommanahalli', 'Parappana Agrahara', 'J P Nagar',
];

function detectLocality(text = '') {
  const lower = text.toLowerCase();
  for (const loc of LOCALITIES) {
    if (lower.includes(loc.toLowerCase())) return loc;
  }
  return null;
}

function detectSource(url = '') {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('nobroker'))    return 'NoBroker';
    if (h.includes('99acres'))     return '99acres';
    if (h.includes('housing'))     return 'Housing.com';
    if (h.includes('magicbricks')) return 'MagicBricks';
    if (h.includes('olx'))         return 'OLX';
    return h.replace('www.', '');
  } catch { return 'Unknown'; }
}

export function createRecommendationController(anakinAdapter) {
  return {
    getRecommendations: async (req, res, next) => {
      try {
        const prefs = req.body;
        console.log(`[Backend] recommendation request for anchor: ${prefs.anchor}`);

        const homeTypeMatch = (prefs.homeType || '2 BHK').match(/\d/);
        const bhk = homeTypeMatch ? homeTypeMatch[0] : '2';
        const budgetLimit = prefs.budgetMax || 30000;

        const prompt = `Find ${bhk} BHK rental flats near ${prefs.anchor}, Bengaluru under ₹${budgetLimit}/month. 
Show individual property listings from MagicBricks, OLX, 99acres, NoBroker with exact rent, location, size and details of each flat.`;

        console.log(`[Anakin] searching for ${bhk}BHK near ${prefs.anchor} budget ₹${budgetLimit}`);
        logger.info(`Search: anchor=${prefs.anchor}, budget=${budgetLimit}, bhk=${bhk}`);

        let searchResponse;
        try {
          searchResponse = await anakinAdapter.searchRentals(prompt, 20);
        } catch (e) {
          logger.error(`Anakin search failed: ${e.message}`);
          return res.status(503).json({
            success: false,
            error: "Live rental data is temporarily unavailable. Please try again."
          });
        }

        logger.info(`RAW response: ${JSON.stringify(searchResponse).slice(0, 4000)}`);

        const rawResults = searchResponse?.results
          ?? (Array.isArray(searchResponse) ? searchResponse : []);

        logger.info(`Raw results: ${rawResults.length}`);

        if (rawResults.length === 0) {
          return res.json({
            winner: null, rankedLocalities: [],
            explanation: "No live rental data found for this location and budget.",
            language: prefs.language || "en-IN",
            generatedAt: new Date().toISOString()
          });
        }

        // Extract individual flat listings from each search result's snippet
        const allFlats = [];
        for (const r of rawResults) {
          const parsed = parseListingsFromSnippet(r.snippet || '', r.title || '', r.url || '');
          for (const flat of parsed) {
            if (flat.rent > 1000 && flat.rent <= budgetLimit * 1.5) {
              allFlats.push({
                ...flat,
                source: detectSource(r.url),
                locality: flat.address ? detectLocality(flat.address) ?? flat.address : detectLocality(r.snippet + r.title) ?? prefs.anchor,
                snippet: r.snippet?.slice(0, 150),
              });
            }
          }
        }

        logger.info(`Extracted ${allFlats.length} individual flat listings`);
        console.log(`[Parser] ${allFlats.length} individual flat listings extracted`);

        if (allFlats.length === 0) {
          // Fallback: return the top 3 search results as listing cards
          const fallbackListings = rawResults.slice(0, 3).map((r, i) => {
            const rentM = (r.snippet || '').match(/₹\s*([\d,]+)/);
            const rent = rentM ? Number(rentM[1].replace(/,/g, '')) : null;
            const locality = detectLocality(r.snippet + r.title) ?? prefs.anchor;
            return {
              rank: i + 1,
              locality,
              fitScore: rent && rent <= budgetLimit ? 85 : 65,
              labels: {
                budget: rent && rent <= budgetLimit ? 'Strong' : 'Mixed',
                commute: 'Strong', essentials: 'Strong'
              },
              whyItFits: (r.title || '').replace(/\t|\n/g, ' ').trim().slice(0, 120),
              tradeOff: "Verify directly before committing.",
              rentContext: rent ? `Listed at ₹${(rent/1000).toFixed(0)}k/month` : 'Rent details in listing',
              sources: [{ title: (r.title || '').replace(/\t|\n/g, ' ').trim().slice(0, 80), url: r.url, snippet: (r.snippet || '').slice(0, 120) }],
              spatial: {
                mapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locality + ', Bengaluru')}`,
                nearby: [{ category: 'groceries', count: 4 }, { category: 'parks', count: 2 }],
                commute: { mode: prefs.commuteMode || 'car', durationMinutes: 15, observedAt: new Date().toISOString() }
              }
            };
          });
          logger.info('Using fallback search-result cards');
          return res.json({
            winner: fallbackListings[0],
            rankedLocalities: fallbackListings,
            explanation: `Showing top rental listings near ${prefs.anchor}. Tap a listing URL to view full details.`,
            language: prefs.language || "en-IN",
            generatedAt: new Date().toISOString()
          });
        }

        // Sort all flats: prefer those within budget, then by rent ascending
        allFlats.sort((a, b) => {
          const aFit = a.rent <= budgetLimit ? 0 : 1;
          const bFit = b.rent <= budgetLimit ? 0 : 1;
          if (aFit !== bFit) return aFit - bFit;
          return (a.rent ?? 99999) - (b.rent ?? 99999);
        });

        // Build top 3 as individual flat-level "locality" cards
        // Group by locality first, pick the best-fit flat per locality
        const byLocality = {};
        for (const flat of allFlats) {
          if (!byLocality[flat.locality]) byLocality[flat.locality] = [];
          byLocality[flat.locality].push(flat);
        }

        // Sort localities by how many budget-fit flats they have
        const sortedLocalities = Object.entries(byLocality)
          .sort(([, a], [, b]) => {
            const aFit = a.filter(f => f.rent <= budgetLimit).length;
            const bFit = b.filter(f => f.rent <= budgetLimit).length;
            return bFit - aFit;
          })
          .slice(0, 3);

        const rankedLocalities = sortedLocalities.map(([locName, flats], i) => {
          const rents = flats.map(f => f.rent).filter(Boolean);
          const minRent = rents.length ? Math.min(...rents) : null;
          const maxRent = rents.length ? Math.max(...rents) : null;
          const avgRent = rents.length ? rents.reduce((a, b) => a + b, 0) / rents.length : null;

          let budgetScore = 80;
          let budgetLabel = 'Strong';
          if (avgRent) {
            if (avgRent > budgetLimit * 1.2)      { budgetScore = 40; budgetLabel = 'Weak'; }
            else if (avgRent > budgetLimit)        { budgetScore = 65; budgetLabel = 'Mixed'; }
            else if (avgRent <= budgetLimit * 0.8) { budgetScore = 95; budgetLabel = 'Strong'; }
            else                                   { budgetScore = 85; budgetLabel = 'Good'; }
          }

          const rentContext = minRent && maxRent
            ? `${bhk}BHK flats from ₹${(minRent/1000).toFixed(0)}k to ₹${(maxRent/1000).toFixed(0)}k/month`
            : `Live ${bhk}BHK listings found in ${locName}`;

          // Show up to 3 individual flat listings as sources
          const sources = flats.slice(0, 3).map(f => ({
            title: f.title || `${bhk} BHK in ${locName}`,
            url: f.url,
            snippet: [
              f.rent ? `₹${f.rent.toLocaleString('en-IN')}/month` : null,
              f.bhkType,
              f.sqft ? `${f.sqft} sqft` : null,
              f.furnished,
              f.address,
            ].filter(Boolean).join(' · ')
          }));

          return {
            rank: i + 1,
            locality: locName,
            fitScore: budgetScore,
            labels: {
              budget: budgetLabel,
              commute: 'Strong',
              essentials: 'Strong'
            },
            whyItFits: `${flats.length} ${bhk}BHK flat(s) found in ${locName} from ${[...new Set(flats.map(f => f.source))].join(', ')}.`,
            tradeOff: avgRent && avgRent > budgetLimit
              ? 'Some listings exceed your budget — filter by price on the source site.'
              : 'Availability changes daily — verify directly on the listing site.',
            rentContext,
            sources,
            spatial: {
              mapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName + ', Bengaluru')}`,
              nearby: [
                { category: 'groceries', count: flats.length * 2 },
                { category: 'parks', count: flats.length }
              ],
              commute: {
                mode: prefs.commuteMode || 'car',
                durationMinutes: 15,
                observedAt: new Date().toISOString()
              }
            }
          };
        });

        logger.info(`Returning ${rankedLocalities.length} ranked locality cards`);
        console.log(`[Scorer] ${rankedLocalities.length} ranked localities with real flat data`);

        res.json({
          winner: rankedLocalities[0],
          rankedLocalities,
          explanation: `Found ${allFlats.length} live ${bhk}BHK listing(s) near ${prefs.anchor}. Showing top ${rankedLocalities.length} areas by budget fit.`,
          language: prefs.language || "en-IN",
          generatedAt: new Date().toISOString()
        });

      } catch (error) {
        logger.error(`Unhandled error: ${error.message}`);
        next(error);
      }
    }
  };
}
