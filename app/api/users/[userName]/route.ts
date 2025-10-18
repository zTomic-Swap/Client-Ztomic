import { NextResponse } from "next/server";
import { readUserKeys, writeUserKeys } from "@/app/lib/userData";
import { UserKey } from "@/app/lib/types";
import { generateKeysFromSecret } from "@/app/lib/keyGeneration";

// Define the type for the destructured params
interface RouteParams {
  params: {
    userName: string;
  };
}

/**
 * GET: Retrieve a single user-key mapping by userName
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const users = await readUserKeys();
    const userName = decodeURIComponent(params.userName);
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
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { secretValue, ...otherUpdates } = (await request.json()) as Partial<UserKey> & {
      secretValue?: string;
    };
    const userName = decodeURIComponent(params.userName);
    const users = await readUserKeys();
    const userIndex = users.findIndex((u) => u.userName === userName);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let generatedKeys = {};
    if (secretValue) {
      generatedKeys = await generateKeysFromSecret(secretValue);
    }
    
    delete otherUpdates.pubKeyX;
    delete otherUpdates.pubKeyY;

    const updatedUser = {
      ...users[userIndex],
      ...otherUpdates,
      ...generatedKeys,
      userName: userName,
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
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const users = await readUserKeys();
    const userName = decodeURIComponent(params.userName);
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

