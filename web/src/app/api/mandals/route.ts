import { NextResponse } from "next/server";

/**
 * Proxy route so client components can fetch mandal data without exposing
 * API_URL or causing CORS issues. Forwards the request to the backend and
 * returns the response as-is.
 */
export async function GET(request: Request) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const upstream = `${apiUrl}/api/mandals${district ? `?district=${encodeURIComponent(district)}` : ""}`;

  const res = await fetch(upstream, {
    next: { revalidate: 300 },
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
