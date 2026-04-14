"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, TrendingUp, ShoppingBag, AlertCircle } from "lucide-react";
import type { Order } from "@/lib/types";
import Header from "@/components/Header";
import OrderCard from "@/components/OrderCard";
import Button from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(!!success);

  // Redirect unauthenticated users to login; redirect admins to their orders view
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?from=/orders");
    } else if (user.role === "admin") {
      router.replace("/admin/orders");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setOrders(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showBanner) return;
    const t = setTimeout(() => setShowBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showBanner]);

  const handleRefund = useCallback(async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "refunded" }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? json.data : o)));
  }, []);

  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = completed.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = completed.length ? Math.round(totalRevenue / completed.length) : 0;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success banner */}
      {showBanner && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg px-4 py-3.5 mb-5 animate-slide-up">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={16} />
          <div>
            <p className="text-sm font-bold text-green-800 dark:text-green-300">Payment successful!</p>
            <p className="text-xs text-green-600 dark:text-green-400/80">Your order was placed and is confirmed below.</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {user?.role === "admin" ? "All Orders" : "My Orders"}
          </h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
            {user?.role === "admin" ? "All customer orders" : "Your order history"}
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary" size="sm">
            <ShoppingBag size={13} />
            New order
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {!authLoading && user && !loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatPill label="Total orders" value={String(orders.length)} />
          <StatPill label="Revenue" value={formatCents(totalRevenue)} />
          <StatPill label="Avg order" value={formatCents(avgOrder)} />
        </div>
      )}

      {/* Auth loading / redirect guard */}
      {(authLoading || (!authLoading && !user)) && (
        <div className="flex justify-center py-24">
          <span className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Loading */}
      {!authLoading && user && loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] animate-pulse" />
          ))}
        </div>
      )}

      {!authLoading && user && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <p className="font-semibold text-slate-900 dark:text-white">Failed to load orders</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!authLoading && user && !loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-4 border border-slate-200 dark:border-white/[0.08]">
            <TrendingUp className="text-slate-300 dark:text-slate-600" size={24} />
          </div>
          <p className="font-semibold text-slate-900 dark:text-white mb-1">No orders yet</p>
          <p className="text-sm text-slate-400 mb-6">Complete a checkout to see orders here</p>
          <Link href="/">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      )}

      {/* Orders list */}
      {!authLoading && user && !loading && !error && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onRefund={handleRefund} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Suspense
        fallback={
          <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] animate-pulse" />
            ))}
          </main>
        }
      >
        <OrdersContent />
      </Suspense>
    </div>
  );
}
