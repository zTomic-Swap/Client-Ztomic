import { NextResponse } from "next/server";
import { readUserKeys, writeUserKeys } from "@/app/lib/userData";
import { UserKey } from "@/app/lib/types";
import { generateKeysFromSecret } from "@/app/lib/keyGeneration"; // Import your new function

interface RouteContext {
  params: { userName: string };
}

/**
 * GET: Retrieve a single user-key mapping by userName
 * (No changes needed)
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const users = await readUserKeys();
    const userName = decodeURIComponent(context.params.userName);
    const user = users.find((u) => u.userName === userName);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a user's keys by re-generating from a new secret
 * (This is the updated part)
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    // 1. Expect a body that *might* contain a new secretValue
    // We separate the secret from other potential updates
    const { secretValue, ...otherUpdates } = (await request.json()) as Partial<UserKey> & {
      secretValue?: string;
    };

    const userName = decodeURIComponent(context.params.userName);
    const users = await readUserKeys();
    const userIndex = users.findIndex((u) => u.userName === userName);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let generatedKeys = {};
    // 2. If a new secret is provided, generate new keys
    if (secretValue) {
      generatedKeys = await generateKeysFromSecret(secretValue);
    }
    
    // 3. We explicitly block pubKeyX/Y from being set directly in the body
    //    by not including them in `otherUpdates` if they exist.
    delete otherUpdates.pubKeyX;
    delete otherUpdates.pubKeyY;

    // 4. Merge the old user data, any "other" updates, and the new keys (if generated)
    const updatedUser = {
      ...users[userIndex], // Old data
      ...otherUpdates,     // Other non-key updates
      ...generatedKeys,    // New keys (overwrites old)
      userName: userName,  // Ensure userName cannot be changed
    };

    users[userIndex] = updatedUser;
    await writeUserKeys(users);

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a single user-key mapping by userName
 * (No changes needed)
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userName = decodeURIComponent(context.params.userName);
    const users = await readUserKeys();
    const newUsers = users.filter((u) => u.userName !== userName);

    if (users.length === newUsers.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await writeUserKeys(newUsers);
    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}