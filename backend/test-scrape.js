import "dotenv/config";
import { Anakin } from "@anakin-io/sdk";

async function test() {
  const anakin = new Anakin({
    apiKey: process.env.ANAKIN_API_KEY
  });
  try {
    console.log("Scraping...");
    const url = "https://www.nobroker.in/property/rent/bangalore/Manyata%20Tech%20Park?searchParam=W3sibGF0IjoxMy4wNDQ2MjIsImxvbiI6NzcuNjIxNDUwNCwicGxhY2VJZCI6IkNoSUpLekU2aXNVVnJqc1JaSHMyeGFtSTdVNCIsInBsYWNlTmFtZSI6Ik1hbnlhdGEgVGVjaCBQYXJrIn1d&radius=2.0&sharedAccomodation=0&city=bangalore&locality=Manyata%20Tech%20Park&type=BHK2";
    const res = await anakin.scrape(url, { generateJson: true });
    console.log("RESULT:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
