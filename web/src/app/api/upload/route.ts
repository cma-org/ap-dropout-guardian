import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function POST(req: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  try {
    const payload = await req.json();

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Backend returned ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error during upload" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("slotId");
    const schoolId = searchParams.get("schoolId");
    const limit = searchParams.get("limit") || "10";

    const params = new URLSearchParams();
    if (slotId) params.set("slotId", slotId);
    if (schoolId) params.set("schoolId", schoolId);
    params.set("limit", limit);

    const res = await fetch(`${API_URL}/api/upload/recent?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Backend returned ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error during fetch" },
      { status: 500 }
    );
  }
}
