import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, getOrdersByUser } from "@/lib/store";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders =
    session.role === "admin"
      ? await getAllOrders()
      : await getOrdersByUser(session.sub);

  return NextResponse.json({ data: orders });
}
