import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getFavoriteIds, toggleFavorite } from "@/lib/store";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ data: [] });
  try {
    const data = await getFavoriteIds(session.sub);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { productId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  try {
    const added = await toggleFavorite(session.sub, body.productId);
    return NextResponse.json({ data: { added } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
