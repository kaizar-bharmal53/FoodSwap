import { NextRequest, NextResponse } from "next/server";
import { getCart, clearCart } from "@/lib/store";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ data: await getCart(session.sub) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cart";
    // FK violation means the session references a user that no longer exists —
    // treat as unauthenticated so the stale cookie is effectively ignored.
    if (message.includes("Foreign key constraint")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ data: await clearCart(session.sub) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
