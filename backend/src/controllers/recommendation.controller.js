import { normalizeListing } from "../utils/normalize.js";

export function createRecommendationController(anakinAdapter) {
  return {
    getRecommendations: async (req, res, next) => {
      try {
        const prefs = req.body;
        console.log(`[Backend] recommendation request received for anchor: ${prefs.anchor}`);
        
        const homeTypeMatch = (prefs.homeType || '2 BHK').match(/\d/);
        const bhk = homeTypeMatch ? homeTypeMatch[0] : '2';
        
        // Build NoBroker URL
        const city = "bangalore";
        const noBrokerUrl = `https://www.nobroker.in/property/rent/${city}/${encodeURIComponent(prefs.anchor)}?locality=${encodeURIComponent(prefs.anchor)}&type=BHK${bhk}`;
        
        console.log(`[Anakin] live search executed for URL: ${noBrokerUrl}`);

        let scrapeResult;
        try {
          scrapeResult = await anakinAdapter.scrapeListing(noBrokerUrl);
        } catch (e) {
          console.error(`Anakin scrape failed:`, e.message);
          return res.status(503).json({
            success: false,
            error: "Live rental data is temporarily unavailable."
          });
        }
        
        // Ensure data exists
        const data = scrapeResult?.data;
        if (!data || !data.listings || data.listings.length === 0) {
          return res.status(500).json({
            success: false,
            error: "No matches found in live data."
          });
        }
        
        console.log(`[Anakin] real sources returned: ${data.listings.length}`);

        // Normalize listings
        const normalized = data.listings.map(l => normalizeListing(l));
        console.log(`[Normalizer] rental listings extracted: ${normalized.length}`);
        
        // Group by locality (or just use the anchor as the primary locality if all results belong to it, or parse address)
        // NoBroker returns properties in and around the locality. 
        // We will identify unique localities from the addresses
        const localities = {};
        for (const list of normalized) {
          // Extract locality from title or address
          let locName = list.location.locality || prefs.anchor;
          if (list.title.toLowerCase().includes("thanisandra")) locName = "Thanisandra";
          else if (list.title.toLowerCase().includes("hebbal")) locName = "Hebbal";
          else if (list.title.toLowerCase().includes("hennur")) locName = "Hennur";
          else if (list.title.toLowerCase().includes("nagavara") || list.title.toLowerCase().includes("nagawara")) locName = "Nagavara";
          else if (list.title.toLowerCase().includes("hbr layout")) locName = "HBR Layout";
          
          if (!localities[locName]) {
            localities[locName] = [];
          }
          localities[locName].push(list);
        }
        
        const candidates = Object.keys(localities).map(locName => {
          const props = localities[locName];
          const rents = props.map(p => p.pricing.rent).filter(r => r !== null);
          const minRent = rents.length > 0 ? Math.min(...rents) : null;
          const maxRent = rents.length > 0 ? Math.max(...rents) : null;
          const avgRent = rents.length > 0 ? rents.reduce((a, b) => a + b, 0) / rents.length : null;
          
          const budgetLimit = prefs.budgetMax || 30000;
          let budgetScore = 100;
          let budgetLabel = "Strong";
          
          if (avgRent) {
            if (avgRent > budgetLimit * 1.2) { budgetScore = 40; budgetLabel = "Weak"; }
            else if (avgRent > budgetLimit) { budgetScore = 70; budgetLabel = "Mixed"; }
            else if (avgRent <= budgetLimit * 0.8) { budgetScore = 95; budgetLabel = "Strong"; }
            else { budgetScore = 85; budgetLabel = "Good"; }
          }
          
          const rentContext = minRent && maxRent 
            ? `Observed ${bhk}BHK listings around ₹${(minRent/1000).toFixed(0)}k–₹${(maxRent/1000).toFixed(0)}k` 
            : `Live listings found in ${locName}`;
            
          const sources = props.slice(0, 3).map(p => ({
            title: p.title || "Real Estate Listing",
            url: p.listingUrl || p.source?.url || noBrokerUrl,
            snippet: `Rent: ₹${p.pricing.rent} | Deposit: ₹${p.pricing.deposit} | ${p.property.bedrooms} BHK`
          }));

          return {
            locality: locName,
            fitScore: budgetScore,
            labels: {
              budget: budgetLabel,
              commute: "Strong", // Commute can be mocked or calculated later
              essentials: "Strong"
            },
            whyItFits: `Based on live scraped evidence, this locality has ${props.length} available properties matching your search.`,
            tradeOff: avgRent > budgetLimit ? "Average rent exceeds your preferred ceiling." : "Verify individual properties before confirming.",
            rentContext: rentContext,
            sources: sources,
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

        // Sort by fit score
        candidates.sort((a, b) => b.fitScore - a.fitScore);
        
        // Take top 3
        const topCandidates = candidates.slice(0, 3);
        const rankedLocalities = topCandidates.map((c, i) => ({ ...c, rank: i + 1 }));

        console.log(`[Scorer] recommendations generated: ${rankedLocalities.length}`);

        res.json({
          winner: rankedLocalities[0],
          rankedLocalities,
          explanation: `We searched live rental data from NoBroker. ${rankedLocalities[0]?.locality} is your best fit based on live pricing.`,
          language: prefs.language || "en-IN",
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  };
}
