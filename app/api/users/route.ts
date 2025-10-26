import { NextResponse } from "next/server";

const EXTERNAL_API = process.env.EXTERNAL_API_URL;
if (!EXTERNAL_API) {
  throw new Error("EXTERNAL_API_URL is not configured");
}

/**
 * Proxy GET /api/users -> EXTERNAL_API/users
 */
export async function GET(request: Request) {
  try {
    const res = await fetch(`${EXTERNAL_API}/users`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * Proxy POST /api/users -> EXTERNAL_API/users
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${EXTERNAL_API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}