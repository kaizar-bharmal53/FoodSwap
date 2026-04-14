import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("productIds") ?? "";
  const productIds = raw.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const data = await getRecommendations(productIds);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
