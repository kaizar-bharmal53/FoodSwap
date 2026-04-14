"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Lock, MapPin, Zap, ShieldCheck, AlertCircle,
  ShoppingBag, Tag, CheckCircle2, Clock, ChevronRight, Plus,
} from "lucide-react";
import type { Cart, DeliveryAddress, SavedAddress } from "@/lib/types";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import { useAuth } from "@/context/AuthContext";

const TAX_RATE = 0.05;

const EMIRATES = [
  "Abu Dhabi", "Dubai", "Sharjah", "Ajman",
  "Umm Al Quwain", "Ras Al Khaimah", "Fujairah",
];

const inputCls =
  "w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors";

// Generate 30-min time slots from now until 23:30
function getTimeSlots(dateStr: string): string[] {
  const slots: string[] = [];
  const base = new Date(dateStr + "T00:00:00");
  const now = new Date();
  for (let h = 9; h <= 23; h++) {
    for (const m of [0, 30]) {
      const d = new Date(base);
      d.setHours(h, m, 0, 0);
      if (d > now) slots.push(`${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`);
    }
  }
  return slots;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAvailable, setStripeAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Address form
  const [address, setAddress] = useState<Partial<DeliveryAddress>>({
    deliveryName: "", deliveryPhone: "", addressLine1: "", addressLine2: "", city: "", emirate: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; type: "percent" | "flat"; value: number; label: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Scheduling
  const [scheduleMode, setScheduleMode] = useState<"asap" | "scheduled">("asap");
  const [schedDate, setSchedDate] = useState(todayStr());
  const [schedTime, setSchedTime] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?from=/checkout");
  }, [authLoading, user, router]);

  useEffect(() => {
    fetch("/api/cart")
      .then(r => r.json())
      .then(async json => {
        if (json.error) throw new Error(json.error);
        const cart: Cart = json.data;
        setCart(cart);
        if (cart.items.length === 0) return;
        const piRes = await fetch("/api/checkout", { method: "PUT" });
        const piJson = await piRes.json();
        if (piJson.error) setStripeAvailable(false);
        else setClientSecret(piJson.data.clientSecret);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    fetch("/api/addresses")
      .then(r => r.json())
      .then(j => {
        const addrs: SavedAddress[] = j.data ?? [];
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.isDefault) ?? addrs[0];
        if (def) {
          setSelectedSavedId(def.id);
          setAddress({ deliveryName: def.deliveryName, deliveryPhone: def.deliveryPhone, addressLine1: def.addressLine1, addressLine2: def.addressLine2, city: def.city, emirate: def.emirate });
        } else {
          setShowNewAddressForm(true);
        }
      })
      .catch(() => setShowNewAddressForm(true));
  }, [user?.id]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoError(null);
    try {
      const res = await fetch(`/api/promo/${encodeURIComponent(promoInput.trim())}`);
      const json = await res.json();
      if (json.error) { setPromoError(json.error); setPromoApplied(null); return; }
      const p = json.data;
      const label = p.type === "percent" ? `${p.value}% off` : `AED ${(p.value / 100).toFixed(2)} off`;
      setPromoApplied({ code: p.code, type: p.type, value: p.value, label });
    } finally {
      setPromoLoading(false);
    }
  };

  const computeDiscount = (subtotal: number): number => {
    if (!promoApplied) return 0;
    if (promoApplied.type === "percent") return Math.round(subtotal * promoApplied.value / 100);
    return promoApplied.value;
  };

  const handleSuccess = () => router.push("/orders?success=1");

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { deliveryName, deliveryPhone, addressLine1, city, emirate } = address;
    if (!deliveryName?.trim() || !deliveryPhone?.trim() || !addressLine1?.trim() || !city?.trim() || !emirate?.trim()) {
      setAddressError("Please fill in all required fields.");
      return;
    }
    setAddressError(null);
    setAddressSubmitted(true);
  };

  const handleSelectSaved = (a: SavedAddress) => {
    setSelectedSavedId(a.id);
    setAddress({ deliveryName: a.deliveryName, deliveryPhone: a.deliveryPhone, addressLine1: a.addressLine1, addressLine2: a.addressLine2, city: a.city, emirate: a.emirate });
    setShowNewAddressForm(false);
    setAddressSubmitted(false);
    setAddressError(null);
  };

  const scheduledFor = scheduleMode === "scheduled" && schedDate && schedTime
    ? new Date(`${schedDate}T${schedTime}:00`).toISOString()
    : undefined;

  const subtotal  = cart?.items.reduce((s, i) => s + i.product.price * i.quantity, 0) ?? 0;
  const tax       = Math.round(subtotal * TAX_RATE);
  const discount  = computeDiscount(subtotal);
  const total     = Math.max(0, subtotal + tax - discount);
  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const timeSlots = getTimeSlots(schedDate);

  return (
    <div className="min-h-screen">
      <Header cartCount={cartCount} />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to cart
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Checkout</h1>

        {!authLoading && user?.role === "admin" && (
          <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
            <ShieldCheck size={15} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <p className="text-sm text-brand-800 dark:text-brand-300">
              <span className="font-semibold">Admin mode</span> — you&apos;re placing a test order as an administrator.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="h-40 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200/80 dark:border-white/[0.07] animate-pulse" />
            <div className="h-56 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200/80 dark:border-white/[0.07] animate-pulse" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">{error}</p>
          </div>
        )}

        {!loading && !error && (!cart || cart.items.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mb-4">
              <ShoppingBag size={20} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Nothing to check out</p>
            <p className="text-sm text-slate-400 mb-6">Add items to your cart first</p>
            <Link href="/"><Button>Browse Menu</Button></Link>
          </div>
        )}

        {!loading && !error && cart && cart.items.length > 0 && (
          <div className="space-y-4">

            {/* ── Order Summary ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200/80 dark:border-white/[0.07] shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Summary</h2>
              </div>
              <div className="p-5">
                <div className="space-y-2.5 mb-4">
                  {cart.items.map(item => (
                    <div key={item.productId} className="flex items-center gap-2.5 text-sm">
                      <span className="text-lg w-7 text-center">{item.product.imageEmoji}</span>
                      <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{item.product.name}</span>
                      {item.note && <span className="text-[10px] italic text-slate-400 hidden sm:block truncate max-w-[100px]">{item.note}</span>}
                      <span className="text-slate-400 text-xs">×{item.quantity}</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{formatCents(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Promo code */}
                <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4 mb-4">
                  {!promoApplied ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={promoInput}
                          onChange={e => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                          placeholder="PROMO CODE"
                          className="w-full pl-8 pr-3 py-2 rounded-md text-xs font-mono uppercase border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
                        />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-3 py-2 rounded-md text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        {promoLoading ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                      <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                      <span className="flex-1 text-xs font-semibold text-green-700 dark:text-green-400">
                        <span className="font-mono">{promoApplied.code}</span> — {promoApplied.label}
                      </span>
                      <button onClick={() => { setPromoApplied(null); setPromoInput(""); }} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
                    </div>
                  )}
                  {promoError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{promoError}</p>}
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCents(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>VAT (5%)</span>
                    <span className="tabular-nums">{formatCents(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-brand-600 dark:text-brand-400 font-semibold">
                      <span className="flex items-center gap-1"><Tag size={11} /> Discount</span>
                      <span className="tabular-nums">-{formatCents(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-white/[0.06] text-[15px]">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCents(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Delivery Address ──────────────────────────────────── */}
            <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200/80 dark:border-white/[0.07] shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-brand-500/15 flex items-center justify-center">
                    <MapPin size={11} className="text-brand-500" />
                  </div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Address</h2>
                </div>
                {addressSubmitted && (
                  <button onClick={() => setAddressSubmitted(false)} className="text-xs text-brand-500 hover:text-brand-400 font-medium">Edit</button>
                )}
              </div>

              <div className="p-5">
                {/* Saved address picker */}
                {savedAddresses.length > 0 && !addressSubmitted && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Saved Addresses</p>
                    <div className="space-y-2">
                      {savedAddresses.map(a => (
                        <button
                          key={a.id}
                          onClick={() => handleSelectSaved(a)}
                          className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors ${
                            selectedSavedId === a.id && !showNewAddressForm
                              ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10"
                              : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{a.label}</p>
                            {a.isDefault && <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Default</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{a.deliveryName} · {a.addressLine1}, {a.city}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => { setShowNewAddressForm(true); setSelectedSavedId(null); setAddressSubmitted(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-md border border-dashed transition-colors flex items-center gap-2 ${
                          showNewAddressForm
                            ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                            : "border-slate-200 dark:border-white/[0.08] text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <Plus size={13} /> <span className="text-xs font-semibold">Use a different address</span>
                      </button>
                    </div>

                    {/* If saved address selected, confirm button */}
                    {selectedSavedId && !showNewAddressForm && (
                      <button
                        onClick={() => setAddressSubmitted(true)}
                        className="mt-3 w-full py-2.5 rounded-md text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} /> Use This Address
                      </button>
                    )}
                  </div>
                )}

                {/* Confirmed address summary */}
                {addressSubmitted && (
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-white">{address.deliveryName}</p>
                    <p>{address.deliveryPhone}</p>
                    <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
                    <p>{address.city}, {address.emirate}</p>
                  </div>
                )}

                {/* New address form */}
                {!addressSubmitted && (savedAddresses.length === 0 || showNewAddressForm) && (
                  <form onSubmit={handleAddressSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-medium text-slate-500">Full Name *</label>
                        <input value={address.deliveryName} onChange={e => setAddress(a => ({ ...a, deliveryName: e.target.value }))} placeholder="Ahmed Al Mansoori" className={inputCls} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-medium text-slate-500">Phone *</label>
                        <input value={address.deliveryPhone} onChange={e => setAddress(a => ({ ...a, deliveryPhone: e.target.value }))} placeholder="+971 50 123 4567" className={inputCls} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-medium text-slate-500">Address Line 1 *</label>
                        <input value={address.addressLine1} onChange={e => setAddress(a => ({ ...a, addressLine1: e.target.value }))} placeholder="Villa 12, Street 4A" className={inputCls} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-medium text-slate-500">Address Line 2</label>
                        <input value={address.addressLine2} onChange={e => setAddress(a => ({ ...a, addressLine2: e.target.value }))} placeholder="Apartment, floor (optional)" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">City *</label>
                        <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Dubai" className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Emirate *</label>
                        <select value={address.emirate} onChange={e => setAddress(a => ({ ...a, emirate: e.target.value }))} className={inputCls}>
                          <option value="">Select</option>
                          {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Save this address for future orders</span>
                    </label>

                    {addressError && <p className="text-xs text-red-600 dark:text-red-400">{addressError}</p>}

                    <Button type="submit" className="w-full">
                      <ChevronRight size={14} /> Continue to Payment
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* ── Scheduling ────────────────────────────────────────── */}
            {addressSubmitted && (
              <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200/80 dark:border-white/[0.07] shadow-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <div className="w-5 h-5 rounded bg-brand-500/15 flex items-center justify-center">
                    <Clock size={11} className="text-brand-500" />
                  </div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">When?</h2>
                </div>
                <div className="p-5">
                  <div className="flex items-center border border-slate-200 dark:border-white/[0.1] rounded-lg overflow-hidden mb-4 text-sm font-semibold">
                    <button
                      onClick={() => setScheduleMode("asap")}
                      className={`flex-1 py-2.5 transition-colors ${scheduleMode === "asap" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05]"}`}
                    >
                      ASAP
                    </button>
                    <button
                      onClick={() => setScheduleMode("scheduled")}
                      className={`flex-1 py-2.5 border-l border-slate-200 dark:border-white/[0.1] transition-colors ${scheduleMode === "scheduled" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05]"}`}
                    >
                      Schedule
                    </button>
                  </div>
                  {scheduleMode === "scheduled" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Date</label>
                        <select value={schedDate} onChange={e => { setSchedDate(e.target.value); setSchedTime(""); }} className={inputCls}>
                          <option value={todayStr()}>Today</option>
                          <option value={tomorrowStr()}>Tomorrow</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Time</label>
                        <select value={schedTime} onChange={e => setSchedTime(e.target.value)} className={inputCls}>
                          <option value="">Select time</option>
                          {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      {schedTime && (
                        <div className="col-span-2 flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 font-medium">
                          <CheckCircle2 size={13} />
                          Scheduled for {new Date(`${schedDate}T${schedTime}:00`).toLocaleString("en-AE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Payment ───────────────────────────────────────────── */}
            {addressSubmitted && (scheduleMode === "asap" || (scheduleMode === "scheduled" && schedTime)) && (
              <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200/80 dark:border-white/[0.07] shadow-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                  <div className="w-5 h-5 rounded bg-brand-500/15 flex items-center justify-center">
                    <Lock size={11} className="text-brand-500" />
                  </div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</h2>
                </div>
                <div className="p-5">
                  {stripeAvailable && clientSecret ? (
                    <StripeCheckoutForm
                      clientSecret={clientSecret}
                      onSuccess={handleSuccess}
                      address={address}
                      promoCode={promoApplied?.code}
                      discount={discount}
                      scheduledFor={scheduledFor}
                      saveAddress={saveAddress}
                    />
                  ) : (
                    <SimulatedPaymentForm
                      onSuccess={handleSuccess}
                      address={address}
                      promoCode={promoApplied?.code}
                      discount={discount}
                      scheduledFor={scheduledFor}
                      saveAddress={saveAddress}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SimulatedPaymentForm({
  onSuccess, address, promoCode, discount, scheduledFor, saveAddress,
}: {
  onSuccess: () => void;
  address: Partial<DeliveryAddress>;
  promoCode?: string;
  discount?: number;
  scheduledFor?: string;
  saveAddress?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "simulated", ...address, promoCode, discount, scheduledFor, saveAddress }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Demo mode</strong> — add <code className="font-mono bg-amber-100 dark:bg-amber-500/20 px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> to enable real payments.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-slate-400">Card number</label>
          <input readOnly value="4242 4242 4242 4242" className="w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-400 text-sm cursor-not-allowed" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Expiry</label>
          <input readOnly value="12/28" className="w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-400 text-sm cursor-not-allowed" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">CVC</label>
          <input readOnly value="•••" className="w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-400 text-sm cursor-not-allowed" />
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        <Zap size={15} /> Complete Order
      </Button>
    </form>
  );
}
