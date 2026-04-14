import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, signToken, makeSessionCookie } from "@/lib/auth";

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
  const res = NextResponse.json({ data: user });
  res.headers.set("Set-Cookie", makeSessionCookie(token));
  return res;
}
