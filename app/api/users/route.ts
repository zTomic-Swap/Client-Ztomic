import { NextResponse } from "next/server";
import { readUserKeys, writeUserKeys } from "@/app/lib/userData";
import { UserKey } from "@/app/lib/types";

/**
 * GET: Retrieve all user-key mappings
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
 * POST: Create a new user-key mapping
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UserKey;

    if (!body.userName || !body.pubKeyX || !body.pubKeyY) {
      return NextResponse.json(
        { error: "Missing required fields: userName, pubKeyX, pubKeyY" },
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

    const newUser: UserKey = {
      userName: body.userName,
      pubKeyX: body.pubKeyX,
      pubKeyY: body.pubKeyY,
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