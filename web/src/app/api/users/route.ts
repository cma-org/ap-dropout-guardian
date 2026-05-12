import { NextResponse } from "next/server";

/**
 * Proxy so client components can fetch user/teacher data without
 * exposing API_URL or causing CORS issues.
 * GET /api/users?role=teacher&schoolId=28161790952
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
  const query = new URLSearchParams();
  const role = searchParams.get("role");
  const schoolId = searchParams.get("schoolId");
  if (role) query.set("role", role);
  if (schoolId) query.set("schoolId", schoolId);

  const qs = query.toString();
  const upstream = `${apiUrl}/api/users${qs ? `?${qs}` : ""}`;

  const res = await fetch(upstream, { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Backend returned ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
