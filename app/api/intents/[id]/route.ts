import { NextResponse } from "next/server";
import { readIntents, writeIntents } from "@/app/lib/data";
import { Intent } from "@/app/lib/types";

// Define the type for the context object
interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET: Retrieve a single intent by ID
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    // Access params *after* the first await
    const intents = await readIntents();
    const { id } = context.params;

    const intent = intents.find((i) => i.id === id);

    if (!intent) {
      return NextResponse.json({ error: "Intent not found" }, { status: 404 });
    }

    return NextResponse.json(intent);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a single intent by ID
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    // Access params *after* the first await
    const updates = (await request.json()) as Partial<Intent>;
    const { id } = context.params;

    const intents = await readIntents();
    const intentIndex = intents.findIndex((i) => i.id === id);

    if (intentIndex === -1) {
      return NextResponse.json({ error: "Intent not found" }, { status: 404 });
    }

    // Update the intent
    const updatedIntent = {
      ...intents[intentIndex],
      ...updates,
      id: id, // Ensure the ID cannot be changed via the body
    };

    intents[intentIndex] = updatedIntent;
    await writeIntents(intents);

    return NextResponse.json(updatedIntent);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a single intent by ID
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    // Access params *after* the first await
    const intents = await readIntents();
    const { id } = context.params;

    const newIntents = intents.filter((i) => i.id !== id);

    if (intents.length === newIntents.length) {
      return NextResponse.json({ error: "Intent not found" }, { status: 404 });
    }

    await writeIntents(newIntents);

    return NextResponse.json({ message: "Intent deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}