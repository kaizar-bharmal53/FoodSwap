import { NextRequest, NextResponse } from "next/server";
import { createOrder, getCart, createSavedAddress, validatePromoCode } from "@/lib/store";
import { getSession } from "@/lib/session";
import type { CheckoutBody } from "@/lib/types";
import Stripe from "stripe";
import { TAX_RATE } from "@/lib/constants";


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

  // Re-validate promo code server-side and compute discount from DB — never trust the client's discount value.
  let serverDiscount = 0;
  if (promoCode) {
    const promoResult = await validatePromoCode(promoCode);
    if (!promoResult.valid) {
      return NextResponse.json({ error: `Promo code invalid: ${promoResult.reason}` }, { status: 400 });
    }
    const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    serverDiscount =
      promoResult.promo.type === "percent"
        ? Math.round(subtotal * promoResult.promo.value / 100)
        : promoResult.promo.value;
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

      // Ensure the PaymentIntent was created by this user and for the correct cart total.
      if (intent.metadata?.userId !== session.sub) {
        return NextResponse.json({ error: "Payment intent does not belong to this user" }, { status: 403 });
      }
      const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
      const tax = Math.round(subtotal * TAX_RATE);
      const expectedTotal = Math.max(0, subtotal + tax - serverDiscount);
      if (intent.amount !== expectedTotal) {
        return NextResponse.json({ error: "Payment amount does not match order total" }, { status: 402 });
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
    serverDiscount,
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
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: "aed",
      automatic_payment_methods: { enabled: true },
      // Bind the intent to this user so we can verify ownership at confirmation time.
      metadata: { userId: session.sub },
    });
    return NextResponse.json({ data: { clientSecret: intent.client_secret } });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
