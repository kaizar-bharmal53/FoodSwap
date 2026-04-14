"use client";

import { useState } from "react";
import { ChevronDown, MapPin, RotateCcw, Clock, Tag, UtensilsCrossed } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCents, formatDate } from "@/lib/utils";
import Badge from "./ui/Badge";

const statusBadge: Record<OrderStatus, { variant: "green" | "yellow" | "red" | "gray" | "blue"; label: string }> = {
  completed: { variant: "green",  label: "Completed" },
  pending:   { variant: "yellow", label: "Pending" },
  refunded:  { variant: "blue",   label: "Refunded" },
  voided:    { variant: "red",    label: "Voided" },
};

interface OrderCardProps {
  order: Order;
  onRefund?: (orderId: string) => Promise<void>;
}

export default function OrderCard({ order, onRefund }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const badge = statusBadge[order.status];

  const handleRefund = async () => {
    if (!onRefund) return;
    setRefunding(true);
    try { await onRefund(order.id); }
    finally { setRefunding(false); }
  };

  return (
    <div className="bg-white dark:bg-[#12121a] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] shadow-card overflow-hidden transition-all duration-200">
      {/* Summary row */}
      <button
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left group"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          order.status === "completed" ? "bg-brand-400"
          : order.status === "refunded" ? "bg-blue-400"
          : order.status === "voided"   ? "bg-red-400"
          : "bg-amber-400"
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tracking-wider">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {order.paymentMethod === "stripe" && (
              <Badge variant="blue">Stripe</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <span className="text-[15px] font-bold text-slate-900 dark:text-white tabular-nums">
          {formatCents(order.total)}
        </span>

        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-white/[0.05] px-4 py-4 animate-slide-up">
          {/* Item list */}
          <div className="space-y-2.5 mb-4">
            {order.items.map((item) => (
              <div key={item.productId}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative w-7 h-7 rounded-md flex-shrink-0 overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.06]">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed size={12} className="text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 min-w-0 text-[13px] text-slate-700 dark:text-slate-300 truncate">
                    {item.product.name}
                  </span>
                  <span className="text-[12px] text-slate-400 flex-shrink-0">×{item.quantity}</span>
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white tabular-nums flex-shrink-0">
                    {formatCents(item.product.price * item.quantity)}
                  </span>
                </div>
                {item.note && (
                  <p className="ml-10 mt-0.5 text-[11px] italic text-slate-400 dark:text-slate-500">
                    {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Scheduled */}
          {order.scheduledFor && (
            <div className="flex items-center gap-2 mb-3 text-[12px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-md px-3 py-2">
              <Clock size={12} />
              <span className="font-semibold">Scheduled for:</span>
              <span>{new Date(order.scheduledFor).toLocaleString("en-AE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] p-3 space-y-1.5 text-[12px]">
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
                <span className="flex items-center gap-1"><Tag size={10} /> {order.promoCode ?? "Discount"}</span>
                <span className="tabular-nums">-{formatCents(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-white/[0.06] text-[13px]">
              <span>Total</span>
              <span className="tabular-nums">{formatCents(order.total)}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.addressLine1 && (
            <div className="mt-3 flex items-start gap-2 text-[12px] text-slate-500 dark:text-slate-400">
              <MapPin size={12} className="mt-0.5 flex-shrink-0 text-brand-400" />
              <div>
                {order.deliveryName && <span className="font-semibold text-slate-700 dark:text-slate-300">{order.deliveryName} · </span>}
                {order.deliveryPhone && <span>{order.deliveryPhone} · </span>}
                {order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.city}, {order.emirate}
              </div>
            </div>
          )}

          {/* Refund */}
          {onRefund && order.status === "completed" && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleRefund}
                disabled={refunding}
                className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {refunding
                  ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <RotateCcw size={12} />
                }
                Refund order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
