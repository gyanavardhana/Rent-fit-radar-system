export function deduplicateListings(listings) {
  const seen = new Map();

  for (const listing of listings) {
    const key = [
      listing.location.locality,
      listing.property.bedrooms,
      listing.pricing.rent,
      listing.location.address,
    ]
      .map(value => String(value ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
      )
      .join("|");

    if (!seen.has(key)) {
      seen.set(key, listing);
    }
  }

  return [...seen.values()];
}
