import { promises as fs } from "fs";
import path from "path";
import { UserKey } from "./types";

// Define the path to your new JSON database file
const dbPath = path.join(process.cwd(), "data", "users.json");

// Initial data to populate the file if it's empty
const initialData: UserKey[] = [
  {
    userName: "alice.ztom",
    pubKeyX: "0x1a2b3c4d5e6f...",
    pubKeyY: "0x7g8h9i0j1k2l...",
  },
  {
    userName: "bob.ztom",
    pubKeyX: "0x3m4n5o6p7q8r...",
    pubKeyY: "0x9s0t1u2v3w4x...",
  },
];

/**
 * Ensures the user database file and directory exist.
 * Writes initial data if the file is empty.
 */
async function ensureDbFile(): Promise<void> {
  try {
    await fs.access(dbPath);
  } catch (e) {
    try {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2), "utf8");
    } catch (writeError) {
      console.error("Failed to create and write initial user db file:", writeError);
      throw writeError;
    }
  }
}

/**
 * Reads all user keys from the JSON file.
 */
export async function readUserKeys(): Promise<UserKey[]> {
  await ensureDbFile();
  try {
    const data = await fs.readFile(dbPath, "utf8");
    if (!data) {
      return initialData;
    }
    return JSON.parse(data) as UserKey[];
  } catch (error) {
    console.error("Error reading from user database:", error);
    throw new Error("Could not read user keys from database.");
  }
}

/**
 * Writes an array of user keys to the JSON file.
 */
export async function writeUserKeys(users: UserKey[]): Promise<void> {
  await ensureDbFile();
  try {
    const data = JSON.stringify(users, null, 2);
    await fs.writeFile(dbPath, data, "utf8");
  } catch (error) {
    console.error("Error writing to user database:", error);
    throw new Error("Could not write user keys to database.");
  }
}