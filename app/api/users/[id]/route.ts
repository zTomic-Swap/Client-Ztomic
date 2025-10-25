import { NextResponse } from "next/server";

const EXTERNAL_API = process.env.EXTERNAL_API_URL;
if (!EXTERNAL_API) {
  throw new Error("EXTERNAL_API_URL is not configured");
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const res = await fetch(`${EXTERNAL_API}/users/${encodeURIComponent(id)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
