import { NextRequest, NextResponse } from "next/server";
import { createUser, signToken, COOKIE_NAME } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/store";
import { clearGuestCartCookie, getGuestCartIdFromRequest } from "@/lib/guest-cart-cookie";
import { SESSION_MAX_AGE_SEC } from "@/lib/constants";

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, and password are required" },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const user = await createUser(name.trim(), email.toLowerCase(), password);
  if (!user) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const token = await signToken(user);

  const guestId = getGuestCartIdFromRequest(req);
  if (guestId) {
    try {
      await mergeGuestCartIntoUser(guestId, user.id);
    } catch {
      // Ignore merge failures; account is still created
    }
  }

  const res = NextResponse.json({ data: user }, { status: 201 });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
  clearGuestCartCookie(res);
  return res;
}
