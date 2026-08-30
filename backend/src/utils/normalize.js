function numberOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const number = Number(
    String(value).replace(/[₹,\s]/g, "")
  );
  return Number.isFinite(number) ? number : null;
}

function clean(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const result = String(value).trim();
  return result.length ? result : null;
}

export function normalizeListing(result) {
  const title = clean(result.title);
  return {
    id: createListingId(result),
    title,
    source: {
      name: detectSource(result.url),
      url: result.url,
    },
    property: {
      type: clean(result.propertyType),
      bedrooms: numberOrNull(result.bedrooms),
      bathrooms: numberOrNull(result.bathrooms),
      furnished: clean(result.furnished),
    },
    pricing: {
      rent: numberOrNull(result.rent),
      deposit: numberOrNull(result.deposit),
      brokerage: numberOrNull(result.brokerage),
    },
    location: {
      city: clean(result.city),
      locality: clean(result.locality),
      address: clean(result.address),
    },
    amenities: Array.isArray(result.amenities)
      ? result.amenities
      : [],
    availability: clean(result.availability),
    images: Array.isArray(result.images) ? result.images : [],
    listingUrl: result.url,
    scrapedAt: new Date().toISOString(),
  };
}

function detectSource(url) {
  if (!url) return "Unknown";
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("nobroker")) return "NoBroker";
    if (hostname.includes("99acres")) return "99acres";
    if (hostname.includes("housing")) return "Housing";
    if (hostname.includes("magicbricks")) return "MagicBricks";
    return hostname.replace("www.", "");
  } catch {
    return "Unknown";
  }
}

function createListingId(result) {
  const raw = [
    result.title,
    result.url,
    result.locality,
    result.rent,
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
  
  return Buffer
    .from(raw)
    .toString("base64url")
    .slice(0, 20);
}
