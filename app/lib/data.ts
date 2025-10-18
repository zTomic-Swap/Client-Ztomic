import { promises as fs } from "fs";
import path from "path";
import { Intent } from "./types";

// Define the path to your JSON database file
const dbPath = path.join(process.cwd(), "data", "intents.json");

// Initial data to populate the file if it's empty
const initialData: Intent[] = [
  {
    id: "order-1",
    initiator: "alice.ztom",
    initiatorAddress: "0x1234...5678",
    fromToken: "zUSDC",
    toToken: "zUSDT",
    amount: 1,
    status: "pending",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    interestedParties: ["bob.ztom"],
  },
  {
    id: "order-2",
    initiator: "charlie.ztom",
    initiatorAddress: "0x9876...5432",
    fromToken: "zUSDT",
    toToken: "zUSDC",
    amount: 1,
    status: "pending",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    interestedParties: [],
  },
];

/**
 * Ensures the database file and directory exist.
 * Writes initial data if the file is empty.
 */
async function ensureDbFile(): Promise<void> {
  try {
    // Check if file exists
    await fs.access(dbPath);
  } catch (e) {
    // File or directory doesn't exist, create it
    try {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2), "utf8");
    } catch (writeError) {
      console.error("Failed to create and write initial db file:", writeError);
      throw writeError;
    }
  }
}

/**
 * Reads all intents from the JSON file.
 */
export async function readIntents(): Promise<Intent[]> {
  await ensureDbFile(); // Make sure file exists before reading
  try {
    const data = await fs.readFile(dbPath, "utf8");
    if (!data) {
      return initialData; // Return initial if file is empty
    }
    return JSON.parse(data) as Intent[];
  } catch (error) {
    console.error("Error reading from database:", error);
    throw new Error("Could not read intents from database.");
  }
}

/**
 * Writes an array of intents to the JSON file.
 */
export async function writeIntents(intents: Intent[]): Promise<void> {
  await ensureDbFile(); // Make sure directory exists before writing
  try {
    const data = JSON.stringify(intents, null, 2);
    await fs.writeFile(dbPath, data, "utf8");
  } catch (error) {
    console.error("Error writing to database:", error);
    throw new Error("Could not write intents to database.");
  }
}