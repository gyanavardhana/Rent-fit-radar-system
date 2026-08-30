import "dotenv/config";
import { Anakin } from "@anakin-io/sdk";

async function test() {
  const anakin = new Anakin({
    apiKey: process.env.ANAKIN_API_KEY
  });
  try {
    console.log("Searching...");
    const res = await anakin.agenticSearch("Find 2 residential localities near Manyata Tech Park for renting a 2 BHK", {
      schema: {
        type: "object",
        properties: {
          localities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                score: { type: "number" }
              }
            }
          }
        }
      }
    });
    console.log("RESULT:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
