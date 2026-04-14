import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getUserById, updateUser, verifyCredentials, signToken, makeSessionCookie, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ data: null });

  try {
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ data: null });

    const user = await getUserById(payload.sub);
    return NextResponse.json({ data: user ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load session";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // If changing password, verify the current one first
  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const valid = await verifyCredentials(payload.email, body.currentPassword);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
  }

  try {
    const updated = await updateUser(payload.sub, {
      name: body.name,
      password: body.newPassword,
    });
    if (!updated) return NextResponse.json({ error: "No changes to save" }, { status: 400 });

    // Re-issue cookie with fresh name in the token
    const newToken = await signToken(updated);
    const res = NextResponse.json({ data: updated });
    res.headers.set("Set-Cookie", makeSessionCookie(newToken));
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
