import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSavedAddresses, createSavedAddress } from "@/lib/store";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await getSavedAddresses(session.sub);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { label, deliveryName, deliveryPhone, addressLine1, addressLine2, city, emirate, isDefault } = body as Record<string, string | boolean | undefined>;
  if (!deliveryName || !deliveryPhone || !addressLine1 || !city || !emirate) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }
  try {
    const data = await createSavedAddress(session.sub, {
      label: (label as string) || "Home",
      deliveryName: deliveryName as string,
      deliveryPhone: deliveryPhone as string,
      addressLine1: addressLine1 as string,
      addressLine2: (addressLine2 as string) || undefined,
      city: city as string,
      emirate: emirate as string,
      isDefault: Boolean(isDefault),
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
