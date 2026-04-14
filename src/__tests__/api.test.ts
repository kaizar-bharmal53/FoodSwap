/**
 * API Integration Tests
 *
 * Tests the store functions (unit) and simulates the full
 * products → cart → checkout → orders flow (integration).
 *
 * Run: npm test
 */

import {
  getAllProducts,
  getProductById,
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "@/lib/store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reset cart between tests so state doesn't leak. */
function resetCart() {
  clearCart();
}

// ─── Products ─────────────────────────────────────────────────────────────────

describe("Product store", () => {
  it("returns seeded products", () => {
    const products = getAllProducts();
    expect(products.length).toBeGreaterThan(0);
  });

  it("gets a product by id", () => {
    const [first] = getAllProducts();
    const found = getProductById(first.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(first.id);
  });

  it("returns undefined for an unknown product id", () => {
    expect(getProductById("does-not-exist")).toBeUndefined();
  });

  it("every product has required fields", () => {
    getAllProducts().forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.sku).toBeTruthy();
      expect(typeof p.price).toBe("number");
      expect(p.price).toBeGreaterThan(0);
    });
  });
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

describe("Cart store", () => {
  beforeEach(resetCart);

  it("starts empty", () => {
    const cart = getCart();
    expect(cart.items).toHaveLength(0);
  });

  it("adds an in-stock item", () => {
    const inStock = getAllProducts().find((p) => p.inStock);
    expect(inStock).toBeDefined();

    const cart = addItemToCart(inStock!.id, 2);
    expect(cart).not.toBeNull();
    expect(cart!.items).toHaveLength(1);
    expect(cart!.items[0].quantity).toBe(2);
  });

  it("accumulates quantity on duplicate add", () => {
    const inStock = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(inStock.id, 1);
    const cart = addItemToCart(inStock.id, 3);
    expect(cart!.items).toHaveLength(1);
    expect(cart!.items[0].quantity).toBe(4);
  });

  it("returns null when product does not exist", () => {
    const result = addItemToCart("bad-id", 1);
    expect(result).toBeNull();
  });

  it("returns null for out-of-stock product", () => {
    const outOfStock = getAllProducts().find((p) => !p.inStock);
    if (!outOfStock) return; // skip if seed data changes
    const result = addItemToCart(outOfStock.id, 1);
    expect(result).toBeNull();
  });

  it("updates item quantity", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 1);
    const cart = updateCartItemQuantity(product.id, 5);
    expect(cart!.items[0].quantity).toBe(5);
  });

  it("removes item when quantity is set to 0", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 2);
    const cart = updateCartItemQuantity(product.id, 0);
    expect(cart!.items).toHaveLength(0);
  });

  it("removes a specific item", () => {
    const [p1, p2] = getAllProducts().filter((p) => p.inStock);
    addItemToCart(p1.id, 1);
    addItemToCart(p2.id, 1);
    const cart = removeItemFromCart(p1.id);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(p2.id);
  });

  it("clears the entire cart", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 3);
    const cart = clearCart();
    expect(cart.items).toHaveLength(0);
  });
});

// ─── Checkout & Orders ────────────────────────────────────────────────────────

describe("Checkout and order flow", () => {
  beforeEach(resetCart);

  it("returns null when checking out an empty cart", () => {
    const order = createOrder("simulated");
    expect(order).toBeNull();
  });

  it("creates an order and clears the cart", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 2);

    const order = createOrder("simulated");
    expect(order).not.toBeNull();
    expect(order!.items).toHaveLength(1);
    expect(order!.status).toBe("completed");
    expect(order!.paymentMethod).toBe("simulated");

    // Cart should be empty after checkout
    expect(getCart().items).toHaveLength(0);
  });

  it("calculates totals correctly", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 3);

    const order = createOrder("simulated");
    const expectedSubtotal = product.price * 3;
    const expectedTax = Math.round(expectedSubtotal * 0.05);
    const expectedTotal = expectedSubtotal + expectedTax;

    expect(order!.subtotal).toBe(expectedSubtotal);
    expect(order!.tax).toBe(expectedTax);
    expect(order!.total).toBe(expectedTotal);
  });

  it("persists order and retrieves it by id", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 1);

    const order = createOrder("simulated")!;
    const retrieved = getOrderById(order.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(order.id);
  });

  it("lists all orders in reverse chronological order", () => {
    // Create two orders
    for (let i = 0; i < 2; i++) {
      clearCart();
      const product = getAllProducts().find((p) => p.inStock)!;
      addItemToCart(product.id, 1);
      createOrder("simulated");
    }

    const orders = getAllOrders();
    expect(orders.length).toBeGreaterThanOrEqual(2);

    // Most recent first
    for (let i = 0; i < orders.length - 1; i++) {
      const a = new Date(orders[i].createdAt).getTime();
      const b = new Date(orders[i + 1].createdAt).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it("updates order status to refunded", () => {
    const product = getAllProducts().find((p) => p.inStock)!;
    addItemToCart(product.id, 1);
    const order = createOrder("simulated")!;

    const updated = updateOrderStatus(order.id, "refunded");
    expect(updated!.status).toBe("refunded");
    expect(getOrderById(order.id)!.status).toBe("refunded");
  });

  it("returns undefined when updating a non-existent order", () => {
    const result = updateOrderStatus("not-real", "voided");
    expect(result).toBeUndefined();
  });
});
