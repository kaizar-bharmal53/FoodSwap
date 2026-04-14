import { NextRequest, NextResponse } from "next/server";
import { createProduct, getAllProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import type { Product } from "@/lib/types";

export async function GET() {
  try {
    return NextResponse.json({ data: await getAllProducts() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, price, sku, description, category, imageEmoji, imageUrl, inStock } =
    body as Partial<Product>;

  if (!name || typeof price !== "number" || !sku) {
    return NextResponse.json(
      { error: "name, price (number), and sku are required" },
      { status: 400 }
    );
  }

  try {
    const product = await createProduct({
      name,
      price,
      sku,
      description: description ?? "",
      category: category ?? "Uncategorized",
      imageEmoji: imageEmoji ?? "🍽️",
      imageUrl,
      inStock: inStock ?? true,
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
