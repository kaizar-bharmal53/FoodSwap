import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, signToken, COOKIE_NAME } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/store";
import { clearGuestCartCookie, getGuestCartIdFromRequest } from "@/lib/guest-cart-cookie";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const user = await verifyCredentials(email.toLowerCase(), password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken(user);

  const guestId = getGuestCartIdFromRequest(req);
  if (guestId) {
    try {
      await mergeGuestCartIntoUser(guestId, user.id);
    } catch {
      // Ignore merge failures; session is still valid
    }
  }

  const res = NextResponse.json({ data: user });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  clearGuestCartCookie(res);
  return res;
}
