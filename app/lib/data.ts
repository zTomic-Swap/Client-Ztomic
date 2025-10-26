import { Intent } from "./types";

const EXTERNAL_API = process.env.EXTERNAL_API_URL;
if (!EXTERNAL_API) {
  throw new Error("EXTERNAL_API_URL is not configured");
}

/**
 * Reads all intents from the external API.
 */
export async function readIntents(): Promise<Intent[]> {
  try {
    const res = await fetch(`${EXTERNAL_API}/intents`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Could not read intents from API");
    }
    return await res.json();
  } catch (error) {
    console.error("Error reading from API:", error);
    throw new Error("Could not read intents from API.");
  }
}

/**
 * Updates intents through the external API.
 */
export async function writeIntents(intents: Intent[]): Promise<void> {
  try {
    // Since there's no batch update endpoint, we have to update each intent individually
    await Promise.all(intents.map(async (intent) => {
      const res = await fetch(`${EXTERNAL_API}/intents/${encodeURIComponent(intent.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Could not update intent ${intent.id}`);
      }
    }));
  } catch (error) {
    console.error("Error writing to API:", error);
    throw new Error("Could not update intents.");
  }
}