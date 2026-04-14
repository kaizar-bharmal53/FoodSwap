// ─── Domain Models ────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number; // in cents
  sku: string;
  description: string;
  category: string;
  imageEmoji: string;
  imageUrl?: string;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  note?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "pending" | "completed" | "refunded" | "voided";

export interface DeliveryAddress {
  deliveryName: string;
  deliveryPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  emirate: string;
}

export interface Order {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number; // cents
  tax: number;      // cents
  discount?: number; // cents
  total: number;    // cents
  promoCode?: string;
  status: OrderStatus;
  paymentIntentId?: string;
  paymentMethod: "stripe" | "simulated";
  // Delivery address (may be absent for legacy/simulated orders)
  deliveryName?: string;
  deliveryPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  emirate?: string;
  scheduledFor?: string; // ISO string
  createdAt: string;
}

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AddToCartBody {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

export interface CheckoutBody extends Partial<DeliveryAddress> {
  paymentMethod: "stripe" | "simulated";
  paymentIntentId?: string;
  promoCode?: string;
  discount?: number;
  scheduledFor?: string; // ISO string
  saveAddress?: boolean;
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export interface PromoCode {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

// ─── Saved Addresses ──────────────────────────────────────────────────────────

export interface SavedAddress extends DeliveryAddress {
  id: string;
  userId: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark";
