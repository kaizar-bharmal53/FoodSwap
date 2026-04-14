"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  Receipt,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Heart,
  Plus,
  MapPin,
  Trash2,
} from "lucide-react";
import type { Order, Product, SavedAddress } from "@/lib/types";
import Header from "@/components/Header";
import Badge from "@/components/ui/Badge";
import { formatCents, formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Mini order row (for recent orders on account page) ───────────────────────

const statusVariant: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  completed: "green",
  pending: "yellow",
  refunded: "blue",
  voided: "red",
};

function MiniOrderRow({ order }: { order: Order }) {
  return (
    <Link
      href="/orders"
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        order.status === "completed" ? "bg-brand-400"
        : order.status === "refunded"  ? "bg-blue-400"
        : order.status === "voided"    ? "bg-red-400"
        : "bg-amber-400"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tracking-wider">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <Badge variant={statusVariant[order.status] ?? "gray"}>{order.status}</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
        </p>
      </div>
      <span className="text-[14px] font-bold text-slate-900 dark:text-white tabular-nums">
        {formatCents(order.total)}
      </span>
      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile, logout } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { favorites, toggleFavorite } = useAuth();

  // Saved addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [deletingAddrId, setDeletingAddrId] = useState<string | null>(null);

  // Profile form
  const [name, setName]           = useState("");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwMsg, setPwMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [pwSaving, setPwSaving]     = useState(false);

  // Redirect if not logged in or admin
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?from=/account");
    } else if (user.role === "admin") {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  // Prefill name
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  // Load orders for stats
  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((json) => setOrders(json.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  // Load favourite products
  useEffect(() => {
    if (!user || favorites.length === 0) { setFavProducts([]); setFavLoading(false); return; }
    fetch("/api/products")
      .then(r => r.json())
      .then(j => {
        const all: Product[] = j.data ?? [];
        setFavProducts(all.filter(p => favorites.includes(p.id)));
      })
      .catch(() => setFavProducts([]))
      .finally(() => setFavLoading(false));
  }, [user, favorites.length]);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    fetch("/api/addresses")
      .then(r => r.json())
      .then(j => setAddresses(j.data ?? []))
      .catch(() => setAddresses([]))
      .finally(() => setAddrLoading(false));
  }, [user]);

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const json = await res.json();
    if (!json.error) setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const handleDeleteAddress = async (id: string) => {
    setDeletingAddrId(id);
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses(prev => prev.filter(a => a.id !== id));
    setDeletingAddrId(null);
  };

  const handleAddFavToCart = async (productId: string) => {
    if (!user) return;
    setAddingToCart(productId);
    try {
      await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    const err = await updateProfile({ name: name.trim() });
    setProfileSaving(false);
    setProfileMsg(err ? { ok: false, text: err } : { ok: true, text: "Name updated successfully!" });
    setTimeout(() => setProfileMsg(null), 4000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match" });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "Password must be at least 8 characters" });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    const err = await updateProfile({ currentPassword: currentPw, newPassword: newPw });
    setPwSaving(false);
    if (err) {
      setPwMsg({ ok: false, text: err });
    } else {
      setPwMsg({ ok: true, text: "Password changed successfully!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwMsg(null), 4000);
    }
  };

  // Computed stats
  const completed  = orders.filter((o) => o.status === "completed");
  const totalSpent = completed.reduce((s, o) => s + o.total, 0);
  const avgOrder   = completed.length ? Math.round(totalSpent / completed.length) : 0;
  const recentOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  const initials = user?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-AE", { month: "long", year: "numeric" })
    : "";

  const inputCls =
    "w-full px-3 py-2.5 rounded-md text-sm bg-white dark:bg-[#0f0f17] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition";

  if (authLoading || (!authLoading && !user)) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center py-32">
          <span className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080810]">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* ── Profile hero ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + info row on mobile */}
            <div className="flex items-center gap-4 sm:contents">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 text-xl font-bold flex-shrink-0 select-none">
                {initials}
              </div>

              {/* Name / email / since */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">{user?.name}</h1>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail size={12} />
                  <span className="truncate">{user?.email}</span>
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar size={11} />
                  Member since {memberSince}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:ml-auto flex-shrink-0">
              <Link
                href="/orders"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                <Receipt size={12} />
                My Orders
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                <ShoppingBag size={12} />
                Order Food
              </Link>
            </div>
          </div>

          {/* Stats bar — 2 cols on mobile, 4 on sm+ */}
          {!ordersLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-white/[0.06] border-t border-slate-100 dark:border-white/[0.06]">
              {[
                { label: "Total Orders",    value: String(orders.length)           },
                { label: "Completed",        value: String(completed.length)        },
                { label: "Total Spent",      value: totalSpent ? formatCents(totalSpent) : "—" },
                { label: "Avg Order",        value: avgOrder   ? formatCents(avgOrder)   : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Edit name + Change password ───────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Edit profile */}
          <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <UserIcon size={14} className="text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Edit Profile</h2>
            </div>

            <form onSubmit={handleProfileSave} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className={inputCls + " opacity-50 cursor-not-allowed"}
                />
                <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 border ${
                  profileMsg.ok
                    ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  {profileMsg.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {profileMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={profileSaving || name.trim() === user?.name}
                className="w-full py-2.5 rounded-md text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {profileSaving && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save Changes
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <Lock size={14} className="text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordSave} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={inputCls}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={inputCls}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputCls}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 border ${
                  pwMsg.ok
                    ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  {pwMsg.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {pwMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                className="w-full py-2.5 rounded-md text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {pwSaving && <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* ── Recent Orders ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <Receipt size={14} className="text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Orders</h2>
            </div>
            {orders.length > 0 && (
              <Link
                href="/orders"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight size={12} />
              </Link>
            )}
          </div>

          {ordersLoading ? (
            <div className="space-y-px">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-50 dark:bg-white/[0.02] animate-pulse mx-4 my-2 rounded-lg" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3 border border-slate-200 dark:border-white/[0.06]">
                <TrendingUp size={20} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No orders yet</p>
              <p className="text-xs text-slate-400 mb-4">Your order history will appear here</p>
              <Link
                href="/"
                className="px-4 py-2 rounded-md text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {recentOrders.map((order) => (
                <MiniOrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* ── Saved Addresses ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Saved Addresses</h2>
            </div>
            <Link href="/checkout" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              + Add at checkout
            </Link>
          </div>

          {addrLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-slate-50 dark:bg-white/[0.02] animate-pulse" />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MapPin size={22} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No saved addresses</p>
              <p className="text-xs text-slate-400">Save an address during checkout to see it here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {addresses.map(addr => (
                <div key={addr.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{addr.label}</p>
                      {addr.isDefault && <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Default</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{addr.deliveryName} · {addr.deliveryPhone}</p>
                    <p className="text-xs text-slate-400">{addr.addressLine1}, {addr.city}, {addr.emirate}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="px-2.5 py-1 rounded text-[11px] font-semibold border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      disabled={deletingAddrId === addr.id}
                      className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Favourites ───────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <Heart size={14} className="text-brand-500" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Favourites</h2>
            </div>
            {favProducts.length > 0 && (
              <Link href="/" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Browse menu
              </Link>
            )}
          </div>

          {favLoading ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-slate-50 dark:bg-white/[0.02] animate-pulse" />)}
            </div>
          ) : favProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart size={22} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No favourites yet</p>
              <p className="text-xs text-slate-400 mb-4">Tap the heart on any item to save it here</p>
              <Link href="/" className="px-4 py-2 rounded-md text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors">
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favProducts.map(product => (
                <div key={product.id} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{product.imageEmoji}</span>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="w-6 h-6 flex items-center justify-center text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      <Heart size={13} className="fill-brand-500" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900 dark:text-white leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">{formatCents(product.price)}</p>
                  </div>
                  <button
                    onClick={() => handleAddFavToCart(product.id)}
                    disabled={!product.inStock || addingToCart === product.id}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white disabled:opacity-50 transition-colors"
                  >
                    {addingToCart === product.id
                      ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <><Plus size={11} /> Add</>
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Account</h2>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Sign out</p>
              <p className="text-xs text-slate-400 mt-0.5">Sign out of your account on this device</p>
            </div>
            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              className="px-4 py-2 rounded-md text-xs font-semibold border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
