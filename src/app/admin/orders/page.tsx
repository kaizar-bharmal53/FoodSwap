"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, ChevronDown, ChevronUp, RefreshCw, Clock, Tag } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCents, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

const STATUS_BADGE: Record<OrderStatus, "green" | "yellow" | "red" | "gray" | "blue"> = {
  completed: "green",
  pending:   "yellow",
  refunded:  "blue",
  voided:    "red",
};

const ACTIONS: Partial<Record<OrderStatus, { label: string; to: OrderStatus; danger?: boolean }[]>> = {
  completed: [
    { label: "Refund", to: "refunded" },
    { label: "Void",   to: "voided",  danger: true },
  ],
  pending: [
    { label: "Complete", to: "completed" },
    { label: "Void",     to: "voided", danger: true },
  ],
};

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter]     = useState<OrderStatus | "all" | "scheduled">("all");

  const load = () => {
    setLoading(true);
    fetch("/api/orders").then(r => r.json()).then(d => {
      setOrders(d.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdating(orderId);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    setUpdating(null);
  };

  const revenue  = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const filtered = filter === "all"
    ? orders
    : filter === "scheduled"
      ? orders.filter(o => !!o.scheduledFor)
      : orders.filter(o => o.status === filter);

  const statusFilters: { label: string; value: OrderStatus | "all" | "scheduled" }[] = [
    { label: "All",       value: "all"       },
    { label: "Completed", value: "completed" },
    { label: "Pending",   value: "pending"   },
    { label: "Scheduled", value: "scheduled" },
    { label: "Refunded",  value: "refunded"  },
    { label: "Voided",    value: "voided"    },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
            {orders.length} total · {formatCents(revenue)} revenue
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Segmented filter — horizontal scroll on mobile */}
      <div className="w-full overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center border border-slate-200 dark:border-white/[0.1] rounded-lg overflow-hidden bg-white dark:bg-white/[0.02] w-max min-w-full sm:w-fit sm:min-w-0">
          {statusFilters.map(({ label, value }, idx) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${idx < statusFilters.length - 1 ? "border-r border-slate-200 dark:border-white/[0.1]" : ""} ${
                filter === value
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {label}
              {value !== "all" && value !== "scheduled" && (
                <span className={`text-[10px] font-bold min-w-[16px] text-center ${filter === value ? "opacity-70" : "text-slate-400"}`}>
                  {orders.filter(o => o.status === value).length}
                </span>
              )}
              {value === "scheduled" && (
                <span className={`text-[10px] font-bold min-w-[16px] text-center ${filter === value ? "opacity-70" : "text-slate-400"}`}>
                  {orders.filter(o => !!o.scheduledFor).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-slate-50/50 dark:bg-white/[0.01]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {filtered.map(order => (
              <div key={order.id}>
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(e => e === order.id ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <Badge variant={STATUS_BADGE[order.status]}>{order.status}</Badge>
                      {order.scheduledFor && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded">
                          <Clock size={10} />
                          {new Date(order.scheduledFor).toLocaleString("en-AE", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {order.promoCode && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded font-mono">
                          <Tag size={10} />{order.promoCode}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        {order.paymentMethod === "stripe" ? "Stripe" : "Simulated"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {(ACTIONS[order.status] ?? []).map(action => (
                      <button
                        key={action.to}
                        disabled={updating === order.id}
                        onClick={() => updateStatus(order.id, action.to)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 border ${
                          action.danger
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100"
                            : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200"
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCents(order.total)}
                    </span>
                    {expanded === order.id
                      ? <ChevronUp  size={14} className="text-slate-400" />
                      : <ChevronDown size={14} className="text-slate-400" />
                    }
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === order.id && (
                  <div className="bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/[0.06] px-5 py-4">
                    {/* Mobile actions */}
                    <div className="sm:hidden flex items-center gap-2 mb-3" onClick={e => e.stopPropagation()}>
                      {(ACTIONS[order.status] ?? []).map(action => (
                        <button
                          key={action.to}
                          disabled={updating === order.id}
                          onClick={() => updateStatus(order.id, action.to)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
                            action.danger
                              ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>

                    {/* Line items */}
                    <div className="space-y-2 mb-3">
                      {order.items.map(item => (
                        <div key={item.productId}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.product.imageEmoji} {item.product.name}
                            <span className="text-slate-400 ml-1.5">× {item.quantity}</span>
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {formatCents(item.product.price * item.quantity)}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] italic text-slate-400 mt-0.5 ml-6">{item.note}</p>
                        )}
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-200 dark:border-white/[0.08] pt-2.5 space-y-1 text-sm">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatCents(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>VAT (5%)</span>
                        <span className="tabular-nums">{formatCents(order.tax)}</span>
                      </div>
                      {order.discount && order.discount > 0 && (
                        <div className="flex justify-between text-brand-600 dark:text-brand-400">
                          <span className="flex items-center gap-1"><Tag size={11} /> {order.promoCode ?? "Discount"}</span>
                          <span className="tabular-nums">-{formatCents(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/[0.08]">
                        <span>Total</span>
                        <span className="tabular-nums">{formatCents(order.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
