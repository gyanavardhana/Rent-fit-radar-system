import { Anakin } from "@anakin-io/sdk";

export class AnakinAdapter {
  constructor() {
    if (!process.env.ANAKIN_API_KEY) {
      throw new Error("ANAKIN_API_KEY is missing");
    }
    this.client = new Anakin({
      apiKey: process.env.ANAKIN_API_KEY,
      timeoutMs: 60000,
      maxRetries: 3,
    });
  }

  async searchRentals(prompt, limit = 10) {
    const response = await this.client.search(prompt, {
      limit,
    });
    return response;
  }

  async scrapeListing(url) {
    return this.client.scrape(url, {
      formats: ["markdown"],
      generateJson: true,
      useBrowser: true,
      country: "in",
    });
  }
}
