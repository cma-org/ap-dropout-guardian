import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.API_URL;

export async function POST(request: NextRequest) {
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const res = await fetch(`${apiUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let detail = `Backend returned ${res.status}`;
      try { const e = await res.json(); if (e.error) detail = e.error; } catch {}
      return NextResponse.json(
        { error: detail },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Chat proxy error:", err);
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 503 }
    );
  }
}
