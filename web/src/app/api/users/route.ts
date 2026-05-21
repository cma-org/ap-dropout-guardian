import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.API_URL;
const internalKey = process.env.INTERNAL_API_KEY;

function internalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-key": internalKey ?? "",
  };
}

export async function POST(request: NextRequest) {
  if (!apiUrl) {
    return NextResponse.json({ error: "API_URL not configured." }, { status: 503 });
  }
  try {
    const body = await request.json();
    const res = await fetch(`${apiUrl}/api/users`, {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}

/**
 * Proxy so client components can fetch user/teacher data without
 * exposing API_URL or causing CORS issues.
 * GET /api/users?role=teacher&schoolId=28161790952
 */
export async function GET(request: NextRequest) {
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  const role = request.nextUrl.searchParams.get("role");
  const schoolId = request.nextUrl.searchParams.get("schoolId");

  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (schoolId) params.set("schoolId", schoolId);
  const qs = params.toString();
  const upstream = `${apiUrl}/api/users${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(upstream, {
      headers: internalHeaders(),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}
