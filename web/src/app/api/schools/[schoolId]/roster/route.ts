import { NextResponse } from "next/server";

/**
 * Proxy route so client components can fetch a school's roster without
 * exposing API_URL or causing CORS issues.
 * GET /api/schools/[schoolId]/roster → backend /api/schools/:schoolId/roster
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL environment variable is not configured." },
      { status: 503 }
    );
  }

  const { schoolId } = await params;
  const res = await fetch(`${apiUrl}/api/schools/${schoolId}/roster`, {
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
