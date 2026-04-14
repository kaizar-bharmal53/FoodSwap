import { NextRequest, NextResponse } from "next/server";
import { createOrder, getCart, createSavedAddress } from "@/lib/store";
import { getSession } from "@/lib/session";
import type { CheckoutBody } from "@/lib/types";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<CheckoutBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    paymentMethod = "simulated",
    paymentIntentId,
    deliveryName,
    deliveryPhone,
    addressLine1,
    addressLine2,
    city,
    emirate,
    promoCode,
    discount,
    scheduledFor,
    saveAddress,
  } = body;

  if (!deliveryName || !deliveryPhone || !addressLine1 || !city || !emirate) {
    return NextResponse.json(
      { error: "Delivery name, phone, address, city, and emirate are required" },
      { status: 400 }
    );
  }

  const cart = await getCart(session.sub);
  if (cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // ── Stripe payment verification ──────────────────────────────────────────────
  if (paymentMethod === "stripe") {
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId is required for Stripe payments" },
        { status: 400 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY or use simulated payment." },
        { status: 500 }
      );
    }

    try {
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status !== "succeeded") {
        return NextResponse.json(
          { error: `Payment not successful: ${intent.status}` },
          { status: 402 }
        );
      }
    } catch (err) {
      console.error("Stripe error:", err);
      return NextResponse.json(
        { error: "Failed to verify payment with Stripe" },
        { status: 500 }
      );
    }
  }

  // Save address if requested
  if (saveAddress && deliveryName && deliveryPhone && addressLine1 && city && emirate) {
    try {
      await createSavedAddress(session.sub, {
        label: "Home",
        deliveryName, deliveryPhone, addressLine1, addressLine2, city, emirate,
        isDefault: false,
      });
    } catch { /* non-fatal */ }
  }

  const order = await createOrder(
    session.sub,
    paymentMethod,
    { deliveryName, deliveryPhone, addressLine1, addressLine2, city, emirate },
    paymentIntentId,
    promoCode,
    discount,
    scheduledFor ? new Date(scheduledFor) : undefined
  );

  if (!order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  return NextResponse.json({ data: order }, { status: 201 });
}

// Create a Stripe PaymentIntent — called before showing the payment form
export async function PUT(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const cart = await getCart(session.sub);
  if (cart.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: "aed",
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ data: { clientSecret: intent.client_secret } });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
