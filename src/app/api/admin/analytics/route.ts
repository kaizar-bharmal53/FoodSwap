import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAnalytics } from "@/lib/store";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? "30"), 7), 90);

  try {
    const data = await getAnalytics(days);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
