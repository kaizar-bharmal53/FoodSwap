import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllPromoCodes, createPromoCode } from "@/lib/store";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = await getAllPromoCodes();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { code?: string; type?: string; value?: number; maxUses?: number; expiresAt?: string; active?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { code, type, value } = body;
  if (!code?.trim() || !type || value === undefined) {
    return NextResponse.json({ error: "code, type, and value are required" }, { status: 400 });
  }
  if (type !== "percent" && type !== "flat") {
    return NextResponse.json({ error: "type must be 'percent' or 'flat'" }, { status: 400 });
  }
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    return NextResponse.json({ error: "value must be a positive integer" }, { status: 400 });
  }
  if (type === "percent" && value > 100) {
    return NextResponse.json({ error: "percent value must be between 1 and 100" }, { status: 400 });
  }
  if (body.maxUses !== undefined && (!Number.isInteger(body.maxUses) || body.maxUses < 1)) {
    return NextResponse.json({ error: "maxUses must be a positive integer" }, { status: 400 });
  }
  try {
    const promo = await createPromoCode({
      code: code.trim(),
      type: type as "percent" | "flat",
      value,
      maxUses: body.maxUses,
      expiresAt: body.expiresAt,
      active: body.active ?? true,
    });
    return NextResponse.json({ data: promo }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create promo code";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
