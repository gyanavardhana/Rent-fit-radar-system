export class RentalService {
  constructor(anakin) {
    this.anakin = anakin;
  }

  buildSearchPrompt(input) {
    const {
      location,
      budget,
      property,
      preferences,
    } = input;

    const requirements = [
      `${property.type} rental`,
      `in ${location.locality}`,
      `${location.city}`,
      `monthly rent between ₹${budget.min} and ₹${budget.max}`,
    ];

    if (preferences.noBrokerage) {
      requirements.push(
        "prefer owner-direct or zero-brokerage listings"
      );
    }
    if (preferences.furnished !== "any") {
      requirements.push(
        `${preferences.furnished}`
      );
    }
    if (preferences.parking) {
      requirements.push("parking");
    }
    if (preferences.petFriendly) {
      requirements.push("pet friendly");
    }

    return `
Find current rental property listings matching these requirements: ${requirements.join(", ")}.

Search broadly across legitimate rental/property websites.
Prioritize actual property listing pages rather than:
- articles
- blogs
- advertisements
- property guides
- generic search pages

For each relevant result, identify:
- property title
- rental price
- deposit
- property type
- bedrooms
- bathrooms
- locality
- address if available
- furnishing status
- brokerage
- amenities
- availability
- source website
- original listing URL

Do not invent missing information.
If a field is unavailable, leave it null.
Return the most relevant current listings.
`.trim();
  }

  async search(input) {
    const prompt = this.buildSearchPrompt(input);
    const response = await this.anakin.searchRentals(
      prompt,
      input.limit
    );

    return {
      prompt,
      response,
    };
  }
}
