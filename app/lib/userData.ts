import { UserKey } from "./types";

const EXTERNAL_API = process.env.EXTERNAL_API_URL;
if (!EXTERNAL_API) {
  throw new Error("EXTERNAL_API_URL is not configured");
}

/**
 * Reads all user keys from the external API.
 */
export async function readUserKeys(): Promise<UserKey[]> {
  try {
    const res = await fetch(`${EXTERNAL_API}/users`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Could not read users from API");
    }
    return await res.json();
  } catch (error) {
    console.error("Error reading from API:", error);
    throw new Error("Could not read users from API.");
  }
}

/**
 * Updates user keys through the external API.
 */
export async function writeUserKeys(users: UserKey[]): Promise<void> {
  try {
    // Since there's no batch update endpoint, we have to update each user individually
    await Promise.all(users.map(async (user) => {
      const res = await fetch(`${EXTERNAL_API}/users/${encodeURIComponent(user.userName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Could not update user ${user.userName}`);
      }
    }));
  } catch (error) {
    console.error("Error writing to API:", error);
    throw new Error("Could not update users.");
  }
}