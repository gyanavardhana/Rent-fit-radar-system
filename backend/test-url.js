import "dotenv/config";
import { Anakin } from "@anakin-io/sdk";

async function test() {
  const anakin = new Anakin({
    apiKey: process.env.ANAKIN_API_KEY
  });
  try {
    const url = "https://www.nobroker.in/property/rent/bangalore/Manyata%20Tech%20Park?locality=Manyata%20Tech%20Park&type=BHK2";
    console.log("Scraping URL:", url);
    const res = await anakin.scrape(url, { generateJson: true, useBrowser: true, country: "in" });
    console.log("RESULT:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
