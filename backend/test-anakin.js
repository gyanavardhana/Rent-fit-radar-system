import "dotenv/config";
import { AnakinAdapter } from "./src/adapters/anakin.adapter.js";

async function test() {
  const anakin = new AnakinAdapter();
  try {
    console.log("Searching...");
    const res = await anakin.searchRentals("Say hello and return a JSON array with [{ \"name\": \"Test\" }]", 1);
    console.log("RESULT:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
