import { NextResponse, type NextRequest } from "next/server";

const apiUrl = process.env.API_URL;
const internalKey = process.env.INTERNAL_API_KEY;

function internalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-key": internalKey ?? "",
  };
}

// PUT /api/interventions/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!apiUrl) return NextResponse.json({ error: "API_URL not configured" }, { status: 503 });

  try {
    const { id } = await params;
    const body = await request.json();
    const res = await fetch(`${apiUrl}/api/interventions/${id}`, {
      method: "PUT",
      headers: internalHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}
