import { NextResponse } from "next/server";

const EXTERNAL_API = process.env.EXTERNAL_API_URL;
if (!EXTERNAL_API) {
  throw new Error("EXTERNAL_API_URL is not configured");
}

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET: Proxy single intent retrieval to external API
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = context.params;
    const res = await fetch(`${EXTERNAL_API}/intents/${encodeURIComponent(id)}`);
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
 * PUT: Proxy intent update to external API
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const res = await fetch(`${EXTERNAL_API}/intents/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
 * DELETE: Proxy intent deletion to external API
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = context.params;
    const res = await fetch(`${EXTERNAL_API}/intents/${encodeURIComponent(id)}`, {
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