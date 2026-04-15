import { NextRequest, NextResponse } from "next/server";
import { addItemToCart, addItemToGuestCart, createGuestCart } from "@/lib/store";
import { getSession } from "@/lib/session";
import type { AddToCartBody } from "@/lib/types";
import { getGuestCartIdFromRequest, setGuestCartCookie } from "@/lib/guest-cart-cookie";

export async function POST(req: NextRequest) {
  let body: Partial<AddToCartBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, quantity } = body;
  const note = (body as Record<string, unknown>).note as string | undefined;

  if (!productId || typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json(
      { error: "productId and quantity (≥1) are required" },
      { status: 400 }
    );
  }

  try {
    const session = await getSession(req);
    if (session) {
      const cart = await addItemToCart(session.sub, productId, quantity, note);
      if (!cart) {
        return NextResponse.json(
          { error: "Product not found or out of stock" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: cart }, { status: 201 });
    }

    let guestId = getGuestCartIdFromRequest(req);
    if (!guestId) {
      const created = await createGuestCart();
      guestId = created.id;
    }

    const cart = await addItemToGuestCart(guestId, productId, quantity, note);
    if (!cart) {
      return NextResponse.json(
        { error: "Product not found or out of stock" },
        { status: 404 }
      );
    }

    const res = NextResponse.json({ data: cart }, { status: 201 });
    setGuestCartCookie(res, guestId);
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
