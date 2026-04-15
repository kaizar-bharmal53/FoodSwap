import { NextRequest, NextResponse } from "next/server";
import {
  getCart,
  clearCart,
  getGuestCart,
  clearGuestCart,
} from "@/lib/store";
import { getSession } from "@/lib/session";
import { clearGuestCartCookie, getGuestCartIdFromRequest } from "@/lib/guest-cart-cookie";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (session) {
    try {
      return NextResponse.json({ data: await getCart(session.sub) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load cart";
      if (message.includes("Foreign key constraint")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: message }, { status: 503 });
    }
  }

  const guestId = getGuestCartIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json({ data: null });
  }

  try {
    const cart = await getGuestCart(guestId);
    if (!cart) {
      const res = NextResponse.json({ data: null });
      clearGuestCartCookie(res);
      return res;
    }
    return NextResponse.json({ data: cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cart";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (session) {
    try {
      return NextResponse.json({ data: await clearCart(session.sub) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear cart";
      return NextResponse.json({ error: message }, { status: 503 });
    }
  }

  const guestId = getGuestCartIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json({ error: "No cart to clear" }, { status: 400 });
  }

  try {
    const cart = await clearGuestCart(guestId);
    const res = NextResponse.json({ data: cart });
    clearGuestCartCookie(res);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
