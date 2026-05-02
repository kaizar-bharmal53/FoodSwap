"use client";

import { useState } from "react";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Button from "./ui/Button";
import type { DeliveryAddress } from "@/lib/types";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface FormProps {
  onSuccess: () => void;
  address: Partial<DeliveryAddress>;
  promoCode?: string;
  scheduledFor?: string;
  saveAddress?: boolean;
}

function InnerForm({ onSuccess, address, promoCode, scheduledFor, saveAddress }: FormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "stripe",
          paymentIntentId: paymentIntent.id,
          ...address,
          promoCode,
          scheduledFor,
          saveAddress,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setLoading(false);
        return;
      }
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!stripe}>
        Pay Now
      </Button>
    </form>
  );
}

interface StripeCheckoutFormProps {
  clientSecret: string;
  onSuccess: () => void;
  address: Partial<DeliveryAddress>;
  promoCode?: string;
  scheduledFor?: string;
  saveAddress?: boolean;
}

export default function StripeCheckoutForm({ clientSecret, onSuccess, address, promoCode, scheduledFor, saveAddress }: StripeCheckoutFormProps) {
  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <InnerForm onSuccess={onSuccess} address={address} promoCode={promoCode} scheduledFor={scheduledFor} saveAddress={saveAddress} />
    </Elements>
  );
}
