/**
 * Database-backed store using Prisma.
 * All functions are async.
 */

import { db } from "./db";
import type { Cart, CartItem, Order, OrderStatus, Product, DeliveryAddress, SavedAddress, PromoCode } from "./types";

// ─── Converters ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    sku: p.sku,
    description: p.description ?? "",
    category: p.category ?? "Uncategorized",
    imageEmoji: p.imageEmoji ?? "🍽️",
    imageUrl: p.imageUrl ?? undefined,
    inStock: p.inStock,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCartItem(item: any): CartItem {
  return {
    productId: item.productId,
    product: toProduct(item.product),
    quantity: item.quantity,
    note: item.note ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCart(c: any): Cart {
  return {
    id: c.id,
    items: (c.items ?? []).map(toCartItem),
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orderItemToCartItem(item: any): CartItem {
  // Prefer joined product for imageUrl; fall back to snapshot values
  const product: Product = item.product
    ? toProduct(item.product)
    : {
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
        sku: item.productSku,
        description: "",
        category: "",
        imageEmoji: item.productEmoji ?? "🍽️",
        inStock: true,
      };
  return { productId: item.productId, product, quantity: item.quantity };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(o: any): Order {
  return {
    id: o.id,
    userId: o.userId ?? undefined,
    items: (o.items ?? []).map(orderItemToCartItem),
    subtotal: o.subtotal,
    tax: o.tax,
    discount: o.discount ?? undefined,
    total: o.total,
    promoCode: o.promoCode ?? undefined,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod as "stripe" | "simulated",
    paymentIntentId: o.paymentIntentId ?? undefined,
    deliveryName: o.deliveryName ?? undefined,
    deliveryPhone: o.deliveryPhone ?? undefined,
    addressLine1: o.addressLine1 ?? undefined,
    addressLine2: o.addressLine2 ?? undefined,
    city: o.city ?? undefined,
    emirate: o.emirate ?? undefined,
    scheduledFor: o.scheduledFor ? new Date(o.scheduledFor).toISOString() : undefined,
    createdAt: new Date(o.createdAt).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSavedAddress(a: any): SavedAddress {
  return {
    id: a.id,
    userId: a.userId,
    label: a.label,
    deliveryName: a.deliveryName,
    deliveryPhone: a.deliveryPhone,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2 ?? undefined,
    city: a.city,
    emirate: a.emirate,
    isDefault: a.isDefault,
    createdAt: new Date(a.createdAt).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPromoCode(p: any): PromoCode {
  return {
    id: p.id,
    code: p.code,
    type: p.type as "percent" | "flat",
    value: p.value,
    maxUses: p.maxUses ?? undefined,
    usedCount: p.usedCount,
    expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : undefined,
    active: p.active,
    createdAt: new Date(p.createdAt).toISOString(),
  };
}

const INCLUDE_ITEMS = {
  items: { include: { product: true } },
} as const;

// ─── Product Operations ───────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const rows = await db.product.findMany({ orderBy: { name: "asc" } });
  return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const row = await db.product.findUnique({ where: { id } });
  return row ? toProduct(row) : undefined;
}

export async function createProduct(data: Omit<Product, "id">): Promise<Product> {
  const row = await db.product.create({
    data: {
      name: data.name,
      price: data.price,
      sku: data.sku,
      description: data.description,
      category: data.category,
      imageEmoji: data.imageEmoji,
      imageUrl: data.imageUrl,
      inStock: data.inStock,
    },
  });
  return toProduct(row);
}

export async function updateProduct(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Partial<Omit<Product, "id">> & Record<string, any>
): Promise<Product | undefined> {
  try {
    const row = await db.product.update({ where: { id }, data });
    return toProduct(row);
  } catch {
    return undefined;
  }
}

// ─── Cart Operations ──────────────────────────────────────────────────────────

async function getOrCreateCart(userId: string) {
  const existing = await db.cart.findUnique({
    where: { userId },
    include: INCLUDE_ITEMS,
  });
  if (existing) return existing;
  return db.cart.create({ data: { userId }, include: INCLUDE_ITEMS });
}

export async function getCart(userId: string): Promise<Cart> {
  const cart = await getOrCreateCart(userId);
  return toCart(cart);
}

export async function addItemToCart(
  userId: string,
  productId: string,
  quantity: number,
  note?: string
): Promise<Cart | null> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.inStock) return null;

  const cart = await getOrCreateCart(userId);

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity, note: note ?? null },
    update: { quantity: { increment: quantity }, ...(note !== undefined ? { note } : {}) },
  });

  await db.cart.update({ where: { id: cart.id }, data: {} });

  return getCart(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number,
  note?: string
): Promise<Cart | null> {
  const cart = await db.cart.findUnique({ where: { userId } });
  if (!cart) return null;

  const item = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) return null;

  if (quantity <= 0) {
    await db.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
  } else {
    await db.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity, ...(note !== undefined ? { note } : {}) },
    });
  }

  await db.cart.update({ where: { id: cart.id }, data: {} });
  return getCart(userId);
}

export async function removeItemFromCart(userId: string, productId: string): Promise<Cart> {
  const cart = await db.cart.findUnique({ where: { userId } });
  if (cart) {
    await db.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
    await db.cart.update({ where: { id: cart.id }, data: {} });
  }
  return getCart(userId);
}

export async function clearCart(userId: string): Promise<Cart> {
  const cart = await db.cart.findUnique({ where: { userId } });
  if (cart) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    await db.cart.update({ where: { id: cart.id }, data: {} });
  }
  return getCart(userId);
}

// ─── Order Operations ─────────────────────────────────────────────────────────

const TAX_RATE = 0.05; // 5% UAE VAT

export async function createOrder(
  userId: string,
  paymentMethod: "stripe" | "simulated",
  address: Partial<DeliveryAddress>,
  paymentIntentId?: string,
  promoCode?: string,
  discount?: number,
  scheduledFor?: Date
): Promise<Order | null> {
  const cart = await getCart(userId);
  if (cart.items.length === 0) return null;

  const subtotal = cart.items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );
  const tax = Math.round(subtotal * TAX_RATE);
  const appliedDiscount = discount ?? 0;
  const total = Math.max(0, subtotal + tax - appliedDiscount);

  const order = await db.order.create({
    data: {
      userId,
      subtotal,
      tax,
      discount:      appliedDiscount > 0 ? appliedDiscount : null,
      promoCode:     promoCode ?? null,
      total,
      status: "completed",
      paymentMethod,
      paymentIntentId,
      deliveryName:  address.deliveryName,
      deliveryPhone: address.deliveryPhone,
      addressLine1:  address.addressLine1,
      addressLine2:  address.addressLine2,
      city:          address.city,
      emirate:       address.emirate,
      scheduledFor:  scheduledFor ?? null,
      items: {
        create: cart.items.map((item) => ({
          productId:    item.productId,
          productName:  item.product.name,
          productPrice: item.product.price,
          productSku:   item.product.sku,
          productEmoji: item.product.imageEmoji,
          quantity:     item.quantity,
          note:         item.note ?? null,
        })),
      },
    },
    include: INCLUDE_ITEMS,
  });

  // Increment promo code usage if applied
  if (promoCode) {
    await db.promoCode.updateMany({
      where: { code: promoCode.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }

  // Clear the user's cart after successful order
  await db.cartItem.deleteMany({
    where: { cart: { userId } },
  });

  return toOrder(order);
}

export async function getAllOrders(): Promise<Order[]> {
  const rows = await db.order.findMany({
    include: INCLUDE_ITEMS,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const rows = await db.order.findMany({
    where: { userId },
    include: INCLUDE_ITEMS,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const row = await db.order.findUnique({ where: { id }, include: INCLUDE_ITEMS });
  return row ? toOrder(row) : undefined;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | undefined> {
  try {
    const row = await db.order.update({
      where: { id },
      data: { status },
      include: INCLUDE_ITEMS,
    });
    return toOrder(row);
  } catch {
    return undefined;
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const rows = await db.favorite.findMany({ where: { userId }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  const existing = await db.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    await db.favorite.delete({ where: { userId_productId: { userId, productId } } });
    return false; // removed
  }
  await db.favorite.create({ data: { userId, productId } });
  return true; // added
}

export async function getFavoriteProducts(userId: string): Promise<Product[]> {
  const rows = await db.favorite.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => toProduct(r.product));
}

// ─── Saved Addresses ──────────────────────────────────────────────────────────

export async function getSavedAddresses(userId: string): Promise<SavedAddress[]> {
  const rows = await db.savedAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toSavedAddress);
}

export async function createSavedAddress(
  userId: string,
  data: Omit<SavedAddress, "id" | "userId" | "createdAt">
): Promise<SavedAddress> {
  // If this is default, clear other defaults first
  if (data.isDefault) {
    await db.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const row = await db.savedAddress.create({
    data: {
      userId,
      label: data.label,
      deliveryName: data.deliveryName,
      deliveryPhone: data.deliveryPhone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      emirate: data.emirate,
      isDefault: data.isDefault ?? false,
    },
  });
  return toSavedAddress(row);
}

export async function updateSavedAddress(
  id: string,
  userId: string,
  data: Partial<Omit<SavedAddress, "id" | "userId" | "createdAt">>
): Promise<SavedAddress | null> {
  if (data.isDefault) {
    await db.savedAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  try {
    const row = await db.savedAddress.update({ where: { id, userId }, data });
    return toSavedAddress(row);
  } catch {
    return null;
  }
}

export async function deleteSavedAddress(id: string, userId: string): Promise<boolean> {
  try {
    await db.savedAddress.delete({ where: { id, userId } });
    return true;
  } catch {
    return false;
  }
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export async function validatePromoCode(
  code: string
): Promise<{ valid: true; promo: PromoCode } | { valid: false; reason: string }> {
  const row = await db.promoCode.findUnique({ where: { code: code.toUpperCase() } });
  if (!row) return { valid: false, reason: "Code not found" };
  if (!row.active) return { valid: false, reason: "Code is no longer active" };
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return { valid: false, reason: "Code has expired" };
  if (row.maxUses !== null && row.usedCount >= row.maxUses) return { valid: false, reason: "Code usage limit reached" };
  return { valid: true, promo: toPromoCode(row) };
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const rows = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toPromoCode);
}

export async function createPromoCode(
  data: Omit<PromoCode, "id" | "usedCount" | "createdAt">
): Promise<PromoCode> {
  const row = await db.promoCode.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      active: data.active,
    },
  });
  return toPromoCode(row);
}

export async function updatePromoCode(
  id: string,
  data: Partial<Omit<PromoCode, "id" | "usedCount" | "createdAt">>
): Promise<PromoCode | null> {
  try {
    const row = await db.promoCode.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code.toUpperCase() } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
        ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return toPromoCode(row);
  } catch {
    return null;
  }
}

export async function deletePromoCode(id: string): Promise<boolean> {
  try {
    await db.promoCode.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ─── Recommendations (co-purchase) ───────────────────────────────────────────

export async function getRecommendations(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) return [];

  // Find orders that contain any of the given products
  const orderIds = await db.orderItem.findMany({
    where: { productId: { in: productIds } },
    select: { orderId: true },
    distinct: ["orderId"],
  });

  if (orderIds.length === 0) return [];

  const ids = orderIds.map((o) => o.orderId);

  // Find all other products in those orders, count co-occurrences
  const coItems = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: ids },
      productId: { notIn: productIds },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 3,
  });

  if (coItems.length === 0) return [];

  const recIds = coItems.map((c) => c.productId);
  const rows = await db.product.findMany({
    where: { id: { in: recIds }, inStock: true },
  });

  // Preserve ranking order
  return recIds
    .map((id) => rows.find((r) => r.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map(toProduct);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics(days: number): Promise<{
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; emoji: string; revenue: number; quantity: number }[];
  statusBreakdown: Record<string, number>;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: { in: ["completed"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Daily revenue map
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const entry = dayMap.get(key);
    if (entry) { entry.revenue += o.total; entry.orders += 1; }
  }
  const dailyRevenue = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

  // Top products by revenue
  const productMap = new Map<string, { name: string; emoji: string; revenue: number; quantity: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const existing = productMap.get(item.productId) ?? { name: item.productName, emoji: item.productEmoji, revenue: 0, quantity: 0 };
      existing.revenue += item.productPrice * item.quantity;
      existing.quantity += item.quantity;
      productMap.set(item.productId, existing);
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // All-time status breakdown
  const allOrders = await db.order.groupBy({ by: ["status"], _count: { id: true } });
  const statusBreakdown: Record<string, number> = {};
  for (const row of allOrders) statusBreakdown[row.status] = row._count.id;

  return { dailyRevenue, topProducts, statusBreakdown };
}
