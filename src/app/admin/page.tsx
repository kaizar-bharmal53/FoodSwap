"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Clock } from "lucide-react";
import type { Order, Product } from "@/lib/types";
import { formatCents, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const STATUS_BADGE: Record<string, "green" | "yellow" | "red" | "gray" | "blue"> = {
  completed: "green",
  pending:   "yellow",
  refunded:  "blue",
  voided:    "red",
};

interface AnalyticsData {
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts:  { name: string; emoji: string; revenue: number; quantity: number }[];
  statusBreakdown: Record<string, number>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// Recharts custom tooltip
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/[0.1] rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      <p className="text-brand-500">{formatCents(payload[0].value)}</p>
    </div>
  );
}

function ProductTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/[0.1] rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      <p className="text-brand-500">{formatCents(payload[0].value)}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]).then(([o, p]) => {
      setOrders(o.data ?? []);
      setProducts(p.data ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetch(`/api/admin/analytics?days=${days}`)
      .then(r => r.json())
      .then(j => setAnalytics(j.data ?? null))
      .catch(() => setAnalytics(null));
  }, [days]);

  const completed  = orders.filter(o => o.status === "completed");
  const revenue    = completed.reduce((s, o) => s + o.total, 0);
  const avgOrder   = completed.length ? revenue / completed.length : 0;
  const outOfStock = products.filter(p => !p.inStock).length;

  // Upcoming scheduled orders (today + tomorrow)
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 2);
  const scheduledOrders = orders
    .filter(o => o.scheduledFor && new Date(o.scheduledFor) >= now && new Date(o.scheduledFor) <= tomorrow)
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
    .slice(0, 5);

  // Chart data — shorten date labels for small widths
  const chartData = (analytics?.dailyRevenue ?? []).map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-AE", { month: "short", day: "numeric" }),
  }));

  const barData = (analytics?.topProducts ?? []).map(p => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name,
    revenue: p.revenue,
    quantity: p.quantity,
  }));

  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">Overview of POS activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Revenue"      value={formatCents(revenue)}    sub={`${completed.length} completed`} />
        <StatCard label="Orders"       value={String(orders.length)}   sub={`${orders.filter(o => o.status === "pending").length} pending`} />
        <StatCard label="Avg Order"    value={formatCents(avgOrder)}   sub="completed only" />
        <StatCard label="Out of Stock" value={String(outOfStock)}      sub={`of ${products.length} products`} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Refunded</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {orders.filter(o => o.status === "refunded").length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voided</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {orders.filter(o => o.status === "voided").length}
          </p>
        </div>
      </div>

      {/* ── Revenue Chart ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Over Time</h2>
          <div className="flex items-center border border-slate-200 dark:border-white/[0.1] rounded-lg overflow-hidden text-xs font-semibold">
            {([7, 30, 90] as const).map((d, i) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={[
                  "px-3 py-1.5 transition-colors",
                  i < 2 ? "border-r border-slate-200 dark:border-white/[0.1]" : "",
                  days === d
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05]",
                ].join(" ")}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 h-56">
          {!analytics ? (
            <div className="h-full rounded-lg bg-slate-50 dark:bg-white/[0.02] animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF2AA1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#FF2AA1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={v => `${Math.round(v / 100)}`} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#FF2AA1" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#FF2AA1" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top Products Chart ────────────────────────────────────────── */}
      {analytics && barData.length > 0 && (
        <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top Products by Revenue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last {days} days · completed orders only</p>
          </div>
          <div className="p-5 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `${Math.round(v / 100)}`} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ProductTooltip />} />
                <Bar dataKey="revenue" fill="#FF2AA1" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Upcoming Scheduled Orders ─────────────────────────────────── */}
      {scheduledOrders.length > 0 && (
        <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.07] flex items-center gap-2">
            <Clock size={14} className="text-brand-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Scheduled</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {scheduledOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-brand-500 font-medium mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(order.scheduledFor!).toLocaleString("en-AE", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCents(order.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Orders ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors uppercase tracking-wide">
            View all →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-14 text-center">
            <ShoppingBag size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {orders.slice(0, 8).map(order => (
              <div
                key={order.id}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    {order.scheduledFor && (
                      <span className="ml-2 text-brand-500 font-medium">
                        Sched. {new Date(order.scheduledFor).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="hidden sm:block"><Badge variant={STATUS_BADGE[order.status] ?? "gray"}>{order.status}</Badge></span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCents(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
