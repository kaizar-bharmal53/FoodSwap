import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateSavedAddress, deleteSavedAddress } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let raw: Record<string, unknown>;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Explicit allowlist — never pass an unfiltered body to the data layer.
  const body = {
    ...(raw.label         !== undefined ? { label:         raw.label         } : {}),
    ...(raw.deliveryName  !== undefined ? { deliveryName:  raw.deliveryName  } : {}),
    ...(raw.deliveryPhone !== undefined ? { deliveryPhone: raw.deliveryPhone } : {}),
    ...(raw.addressLine1  !== undefined ? { addressLine1:  raw.addressLine1  } : {}),
    ...(raw.addressLine2  !== undefined ? { addressLine2:  raw.addressLine2  } : {}),
    ...(raw.city          !== undefined ? { city:          raw.city          } : {}),
    ...(raw.emirate       !== undefined ? { emirate:       raw.emirate       } : {}),
    ...(raw.isDefault     !== undefined ? { isDefault:     raw.isDefault     } : {}),
  };

  try {
    const data = await updateSavedAddress(id, session.sub, body);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const ok = await deleteSavedAddress(id, session.sub);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
