import { NextResponse } from "next/server";
import { readIntents, writeIntents } from "@/app/lib/data";
import { Intent } from "@/app/lib/types";
import { randomUUID } from "crypto";

/**
 * GET: Retrieve all intents
 */
export async function GET(request: Request) {
  try {
    const intents = await readIntents();
    return NextResponse.json(intents);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new intent
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<Intent, "id" | "createdAt">;

    // Create a full new intent object
    const newIntent: Intent = {
      ...body,
      id: `order-${randomUUID()}`, // Generate a new ID
      createdAt: new Date().toISOString(),
      status: "pending", // Ensure default status
      interestedParties: [], // Ensure default
    };

    const intents = await readIntents();
    const updatedIntents = [newIntent, ...intents];
    await writeIntents(updatedIntents);

    return NextResponse.json(newIntent, { status: 201 }); // 201 Created
  } catch (error) {
    let errorMessage = "Failed to create intent.";
    if (error instanceof SyntaxError) {
      errorMessage = "Invalid JSON in request body.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}