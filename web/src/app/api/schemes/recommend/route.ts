import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json({ error: "API_URL not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${apiUrl}/api/schemes/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}
