import { NextResponse } from "next/server";

/**
 * Proxy route so client components can fetch metrics without exposing API_URL
 * or causing CORS issues. Forwards the request to the backend and returns
 * the response as-is.
 */
export async function GET() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  const res = await fetch(`${apiUrl}/api/metrics`, {
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
