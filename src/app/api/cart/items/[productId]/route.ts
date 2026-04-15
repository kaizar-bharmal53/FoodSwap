import { NextRequest, NextResponse } from "next/server";
import {
  updateCartItemQuantity,
  removeItemFromCart,
  updateGuestCartItemQuantity,
  removeItemFromGuestCart,
} from "@/lib/store";
import { getSession } from "@/lib/session";
import type { UpdateCartItemBody } from "@/lib/types";
import { getGuestCartIdFromRequest } from "@/lib/guest-cart-cookie";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  let body: Partial<UpdateCartItemBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { quantity } = body;
  const note = (body as Record<string, unknown>).note as string | undefined;
  if (typeof quantity !== "number") {
    return NextResponse.json({ error: "quantity must be a number" }, { status: 400 });
  }

  const session = await getSession(req);
  if (session) {
    const cart = await updateCartItemQuantity(session.sub, productId, quantity, note);
    if (!cart) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }
    return NextResponse.json({ data: cart });
  }

  const guestId = getGuestCartIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await updateGuestCartItemQuantity(guestId, productId, quantity, note);
  if (!cart) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  return NextResponse.json({ data: cart });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const session = await getSession(req);
  if (session) {
    const cart = await removeItemFromCart(session.sub, productId);
    return NextResponse.json({ data: cart });
  }

  const guestId = getGuestCartIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await removeItemFromGuestCart(guestId, productId);
  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  return NextResponse.json({ data: cart });
}
