import { NextResponse } from "next/server";
import { readUserKeys, writeUserKeys } from "@/app/lib/userData";
import { UserKey } from "@/app/lib/types";
import { generateKeysFromSecret } from "@/app/lib/keyGeneration"; // Import your new function

/**
 * GET: Retrieve all user-key mappings
 * (No changes needed)
 */
export async function GET(request: Request) {
  try {
    const users = await readUserKeys();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new user and generate keys from a secret
 * (This is the updated part)
 */
export async function POST(request: Request) {
  try {
    // 1. Now we expect userName and secretValue
    const body = (await request.json()) as {
      userName: string;
      secretValue: string;
    };

    if (!body.userName || !body.secretValue) {
      return NextResponse.json(
        { error: "Missing required fields: userName, secretValue" },
        { status: 400 }
      );
    }

    const users = await readUserKeys();
    const existingUser = users.find((u) => u.userName === body.userName);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this userName already exists" },
        { status: 409 } // 409 Conflict
      );
    }

    // 2. Call your key generation algorithm
    const { pubKeyX, pubKeyY } = await generateKeysFromSecret(body.secretValue);

    // 3. Create the new user with the generated keys
    const newUser: UserKey = {
      userName: body.userName,
      pubKeyX: pubKeyX,
      pubKeyY: pubKeyY,
    };

    const updatedUsers = [newUser, ...users];
    await writeUserKeys(updatedUsers);

    return NextResponse.json(newUser, { status: 201 }); // 201 Created
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}