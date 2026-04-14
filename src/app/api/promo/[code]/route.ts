import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const result = await validatePromoCode(code);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json({ data: result.promo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
