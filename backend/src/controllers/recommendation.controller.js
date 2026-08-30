import { logger } from "../utils/logger.js";

/**
 * Try to extract a rent number from a text snippet.
 * Looks for patterns like ₹15,000 / Rs 15000 / 15k / 15,000/month
 */
function extractRent(text = '') {
  const patterns = [
    /₹\s*([\d,]+)/,
    /Rs\.?\s*([\d,]+)/i,
    /([\d,]+)\s*\/?\s*month/i,
    /([\d]+)k\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      let val = m[1].replace(/,/g, '');
      if (re.toString().includes('k')) val = String(Number(val) * 1000);
      const n = Number(val);
      if (n > 1000 && n < 500000) return n;
    }
  }
  return null;
}

/**
 * Try to detect a known Bengaluru locality from text.
 */
const LOCALITIES = [
  'Thanisandra', 'Hebbal', 'Hennur', 'Nagavara', 'Nagawara',
  'HBR Layout', 'Yelahanka', 'Ramamurthy Nagar', 'Kalyan Nagar',
  'Banaswadi', 'Whitefield', 'Marathahalli', 'HSR Layout', 'Koramangala',
  'Indiranagar', 'BTM Layout', 'Jayanagar', 'JP Nagar', 'Electronic City',
  'Sarjapur', 'Bellandur', 'KR Puram', 'Hoodi', 'Mahadevapura',
];

function detectLocality(text = '', anchor = '') {
  const lower = text.toLowerCase();
  for (const loc of LOCALITIES) {
    if (lower.includes(loc.toLowerCase())) return loc;
  }
  return anchor;
}

function detectSource(url = '') {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('nobroker')) return 'NoBroker';
    if (h.includes('99acres')) return '99acres';
    if (h.includes('housing')) return 'Housing.com';
    if (h.includes('magicbricks')) return 'MagicBricks';
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
Show current listings from NoBroker, 99acres, MagicBricks. Include rent price, locality name, and listing URL.`;

        console.log(`[Anakin] searching for: ${prefs.anchor}`);
        logger.info(`Search started: anchor=${prefs.anchor}, budget=${budgetLimit}, bhk=${bhk}`);

        let searchResponse;
        try {
          searchResponse = await anakinAdapter.searchRentals(prompt, 20);
        } catch (e) {
          console.error(`Anakin search failed:`, e.message);
          logger.error(`Anakin search failed: ${e.message}`);
          return res.status(503).json({
            success: false,
            error: "Live rental data is temporarily unavailable. Please try again in a moment."
          });
        }

        logger.info(`RAW response keys: ${Object.keys(searchResponse || {}).join(', ')}`);
        logger.info(`RAW response: ${JSON.stringify(searchResponse).slice(0, 3000)}`);

        // Anakin search returns: { id, results: [{ title, url, snippet, date }] }
        const rawResults = searchResponse?.results
          ?? (Array.isArray(searchResponse) ? searchResponse : []);

        logger.info(`Raw results count: ${rawResults.length}`);
        console.log(`[Anakin] ${rawResults.length} search results returned`);

        if (rawResults.length === 0) {
          return res.json({
            winner: null,
            rankedLocalities: [],
            explanation: "No live rental data found for this location and budget.",
            language: prefs.language || "en-IN",
            generatedAt: new Date().toISOString()
          });
        }

        // Parse each search result snippet into a structured listing
        const parsedListings = rawResults
          .map(r => {
            const text = `${r.title || ''} ${r.snippet || ''}`;
            const rent = extractRent(text);
            const locality = detectLocality(text, prefs.anchor);
            const source = detectSource(r.url || '');
            return { title: r.title, url: r.url, snippet: r.snippet, rent, locality, source };
          })
          .filter(l => l.title && l.url); // must have at least title + URL

        logger.info(`Parsed ${parsedListings.length} structured listings`);
        console.log(`[Normalizer] ${parsedListings.length} listings after parsing`);

        if (parsedListings.length === 0) {
          return res.json({
            winner: null,
            rankedLocalities: [],
            explanation: "Live search completed but no structured listings could be extracted.",
            language: prefs.language || "en-IN",
            generatedAt: new Date().toISOString()
          });
        }

        // Group by locality
        const localityMap = {};
        for (const l of parsedListings) {
          if (!localityMap[l.locality]) localityMap[l.locality] = [];
          localityMap[l.locality].push(l);
        }

        const candidates = Object.keys(localityMap).map(locName => {
          const props = localityMap[locName];
          const rents = props.map(p => p.rent).filter(r => r !== null);
          const minRent = rents.length > 0 ? Math.min(...rents) : null;
          const maxRent = rents.length > 0 ? Math.max(...rents) : null;
          const avgRent = rents.length > 0 ? rents.reduce((a, b) => a + b, 0) / rents.length : null;

          let budgetScore = 80; // default when no rent data
          let budgetLabel = "Strong";
          if (avgRent) {
            if (avgRent > budgetLimit * 1.2)      { budgetScore = 40; budgetLabel = "Weak"; }
            else if (avgRent > budgetLimit)        { budgetScore = 70; budgetLabel = "Mixed"; }
            else if (avgRent <= budgetLimit * 0.8) { budgetScore = 95; budgetLabel = "Strong"; }
            else                                   { budgetScore = 85; budgetLabel = "Good"; }
          }

          const rentContext = minRent && maxRent
            ? `Observed ${bhk}BHK listings around ₹${(minRent/1000).toFixed(0)}k–₹${(maxRent/1000).toFixed(0)}k`
            : `Live listings found near ${locName}`;

          const sources = props.slice(0, 3).map(p => ({
            title: (p.title || 'Rental Listing').slice(0, 80),
            url: p.url,
            snippet: p.snippet?.slice(0, 120) || `${bhk} BHK in ${locName}`
          }));

          return {
            locality: locName,
            fitScore: budgetScore,
            labels: {
              budget: budgetLabel,
              commute: "Strong",
              essentials: "Strong"
            },
            whyItFits: `Found ${props.length} live ${bhk}BHK listing(s) near ${locName} from ${[...new Set(props.map(p => p.source))].join(', ')}.`,
            tradeOff: avgRent > budgetLimit
              ? "Average observed rent exceeds your preferred ceiling."
              : "Verify individual properties directly before committing.",
            rentContext,
            sources,
            spatial: {
              mapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName + ', Bengaluru')}`,
              nearby: [
                { category: 'groceries', count: props.length * 2 },
                { category: 'parks', count: props.length }
              ],
              commute: {
                mode: prefs.commuteMode || 'car',
                durationMinutes: 15,
                observedAt: new Date().toISOString()
              }
            }
          };
        });

        candidates.sort((a, b) => b.fitScore - a.fitScore);
        const rankedLocalities = candidates.slice(0, 3).map((c, i) => ({ ...c, rank: i + 1 }));

        console.log(`[Scorer] ${rankedLocalities.length} ranked localities`);
        logger.info(`Returning ${rankedLocalities.length} ranked localities`);

        res.json({
          winner: rankedLocalities[0],
          rankedLocalities,
          explanation: `Searched live web for ${bhk}BHK rentals near ${prefs.anchor}. ${rankedLocalities[0]?.locality ?? prefs.anchor} is your best match based on current listings.`,
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
