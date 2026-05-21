import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.API_URL;
const internalKey = process.env.INTERNAL_API_KEY;

function internalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-key": internalKey ?? "",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ districtName: string }> }
) {
  if (!apiUrl) return NextResponse.json({ error: "API_URL not configured" }, { status: 503 });

  try {
    const { districtName } = await params;
    const { searchParams } = new URL(request.url);
    const res = await fetch(`${apiUrl}/api/analytics/district/${encodeURIComponent(districtName)}?${searchParams.toString()}`, {
      headers: internalHeaders(),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}
