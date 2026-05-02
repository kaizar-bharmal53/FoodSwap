import type { NextRequest, NextResponse } from "next/server";
import { GUEST_CART_COOKIE, GUEST_CART_MAX_AGE_SEC } from "@/lib/auth";

export function getGuestCartIdFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(GUEST_CART_COOKIE)?.value;
}

export function setGuestCartCookie(res: NextResponse, cartId: string): void {
  res.cookies.set(GUEST_CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_CART_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearGuestCartCookie(res: NextResponse): void {
  res.cookies.set(GUEST_CART_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
