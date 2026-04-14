"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Zap, ShoppingBag, LogIn, ShieldCheck, Sparkles, Plus } from "lucide-react";
import type { Cart, Product } from "@/lib/types";
import CartItemRow from "@/components/CartItemRow";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const TAX_RATE = 0.05;

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [addingRec, setAddingRec] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setCart(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch recommendations when cart loads
  useEffect(() => {
    if (!cart || cart.items.length === 0) { setRecommendations([]); return; }
    const ids = cart.items.map(i => i.productId).join(",");
    fetch(`/api/recommendations?productIds=${ids}`)
      .then(r => r.json())
      .then(j => setRecommendations(j.data ?? []))
      .catch(() => setRecommendations([]));
  }, [cart?.id]);

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number, note?: string) => {
    const res = await fetch(`/api/cart/items/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, note }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    setCart(json.data);
  }, []);

  const handleAddRecommendation = async (productId: string) => {
    if (!user) { router.push("/login?from=/cart"); return; }
    setAddingRec(productId);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const json = await res.json();
      if (!json.error) {
        setCart(json.data);
        setRecommendations(prev => prev.filter(p => p.id !== productId));
      }
    } finally {
      setAddingRec(null);
    }
  };

  const handleRemove = useCallback(async (productId: string) => {
    const res = await fetch(`/api/cart/items/${productId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    setCart(json.data);
  }, []);

  const handleSimulatedCheckout = async () => {
    setCheckingOut(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "simulated" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      router.push("/orders?success=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const subtotal  = cart?.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0) ?? 0;
  const tax       = Math.round(subtotal * TAX_RATE);
  const total     = subtotal + tax;
  const isEmpty   = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      <Header cartCount={cartCount} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white mb-5 transition-colors uppercase tracking-wide">
          <ArrowLeft size={13} />
          Menu
        </Link>

        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cart</h1>
            {cartCount > 0 && (
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Admin notice */}
        {!authLoading && user?.role === "admin" && (
          <div className="flex items-center gap-2.5 mb-5 px-4 py-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
            <ShieldCheck size={14} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <p className="text-sm text-brand-800 dark:text-brand-300">
              <span className="font-semibold">Admin mode</span> — test order only. Customer carts are managed separately.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-4 border border-slate-200 dark:border-white/[0.08]">
              <ShoppingBag size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Your cart is empty</p>
            <p className="text-sm text-slate-400 mb-6">Add items from the menu to get started</p>
            <Link href="/">
              <Button>
                <ShoppingBag size={14} />
                Browse Menu
              </Button>
            </Link>
          </div>
        )}

        {/* Content */}
        {!loading && !isEmpty && (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Items */}
            <div className="flex-1 bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.05] px-4">
              {cart!.items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="lg:w-72 xl:w-80 space-y-3">
              <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.02]">
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Summary</h2>
                </div>
                <div className="p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-semibold text-slate-900 dark:text-white">{formatCents(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>VAT <span className="text-xs">(5%)</span></span>
                    <span className="tabular-nums font-semibold text-slate-900 dark:text-white">{formatCents(tax)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-white/[0.07] pt-2.5 flex justify-between text-slate-900 dark:text-white font-bold text-[15px]">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCents(total)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mx-4 mb-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="px-4 pb-4 space-y-2">
                  {!authLoading && !user ? (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] px-3.5 py-3 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">Sign in to complete your purchase</p>
                        <Link href="/login?from=/checkout" className="block">
                          <Button size="lg" className="w-full">
                            <LogIn size={14} />
                            Sign in to checkout
                          </Button>
                        </Link>
                      </div>
                      <Link href="/register" className="block">
                        <Button variant="ghost" size="md" className="w-full text-slate-400 text-xs">
                          No account? Create one free
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Button size="lg" className="w-full" onClick={() => router.push("/checkout")}>
                        <CreditCard size={14} />
                        Pay with Stripe
                      </Button>
                      <Button variant="secondary" size="lg" className="w-full" loading={checkingOut} onClick={handleSimulatedCheckout}>
                        <Zap size={14} />
                        Simulate Payment
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Link href="/" className="block">
                <Button variant="ghost" size="md" className="w-full text-slate-400">
                  <ArrowLeft size={13} />
                  Continue shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand-500" />
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">You might also like</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendations.map(product => (
                <div key={product.id} className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl w-8 text-center flex-shrink-0">{product.imageEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-[12px] text-slate-400 tabular-nums">{formatCents(product.price)}</p>
                  </div>
                  <button
                    onClick={() => handleAddRecommendation(product.id)}
                    disabled={addingRec === product.id}
                    className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white transition-colors disabled:opacity-50"
                  >
                    {addingRec === product.id
                      ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Plus size={13} strokeWidth={2.5} />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
