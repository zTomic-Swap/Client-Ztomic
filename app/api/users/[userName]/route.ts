import { NextResponse } from "next/server";

const EXTERNAL_API = process.env.EXTERNAL_API_URL;
if (!EXTERNAL_API) {
  throw new Error("EXTERNAL_API_URL is not configured");
}

interface RouteParams {
  params: {
    userName: string;
  };
}

/**
 * GET: Proxy retrieval of a single user by userName to external API
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const userName = encodeURIComponent(params.userName);
    const res = await fetch(`${EXTERNAL_API}/users/${userName}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Proxy update of user's keys to external API
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const userName = encodeURIComponent(params.userName);
    const body = await request.json();
    
    const res = await fetch(`${EXTERNAL_API}/users/${userName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Proxy deletion of a user to external API
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const userName = encodeURIComponent(params.userName);
    const res = await fetch(`${EXTERNAL_API}/users/${userName}`, {
      method: "DELETE"
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
