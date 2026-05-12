import { NextResponse } from "next/server";

/**
 * Proxy so client components can fetch the school list without exposing
 * API_URL or causing CORS issues.
 * GET /api/schools → backend /api/schools
 */
export async function GET() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  const res = await fetch(`${apiUrl}/api/schools`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Backend returned ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
