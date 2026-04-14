"use client";

import { useState } from "react";
import { Minus, Plus, X, MessageSquare } from "lucide-react";
import type { CartItem } from "@/lib/types";
import { formatCents } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number, note?: string) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
}

export default function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const [loading, setLoading] = useState(false);
  const [showNote, setShowNote] = useState(!!item.note);
  const [note, setNote] = useState(item.note ?? "");
  const [noteSaving, setNoteSaving] = useState(false);

  const handleQuantity = async (delta: number) => {
    setLoading(true);
    try {
      const next = item.quantity + delta;
      if (next <= 0) await onRemove(item.productId);
      else await onUpdateQuantity(item.productId, next);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try { await onRemove(item.productId); }
    finally { setLoading(false); }
  };

  const handleNoteBlur = async () => {
    if (note === (item.note ?? "")) return;
    setNoteSaving(true);
    try { await onUpdateQuantity(item.productId, item.quantity, note || undefined); }
    finally { setNoteSaving(false); }
  };

  return (
    <div className={`py-3.5 transition-opacity ${loading ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Emoji */}
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-xl flex-shrink-0 border border-slate-200 dark:border-white/[0.08]">
          {item.product.imageEmoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
            {item.product.name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{formatCents(item.product.price)} each</p>
        </div>

        {/* Qty stepper */}
        <div className="flex items-center border border-slate-200 dark:border-white/[0.1] rounded-md overflow-hidden bg-white dark:bg-white/[0.03]">
          <button
            onClick={() => handleQuantity(-1)}
            disabled={loading}
            aria-label="Decrease"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors disabled:pointer-events-none border-r border-slate-200 dark:border-white/[0.1]"
          >
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center text-[13px] font-bold text-slate-900 dark:text-white tabular-nums select-none">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantity(1)}
            disabled={loading}
            aria-label="Increase"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors disabled:pointer-events-none border-l border-slate-200 dark:border-white/[0.1]"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>

      {/* Line total */}
      <span className="w-14 sm:w-16 text-right text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums flex-shrink-0">
        {formatCents(item.product.price * item.quantity)}
      </span>

        {/* Remove */}
        <button
          onClick={handleRemove}
          disabled={loading}
          aria-label="Remove"
          className="w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:pointer-events-none"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Note row */}
      <div className="pl-[52px] mt-1.5">
        {!showNote ? (
          <button
            onClick={() => setShowNote(true)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-500 transition-colors"
          >
            <MessageSquare size={11} />
            Add special instructions
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="e.g. no onions, extra sauce..."
              maxLength={120}
              className="flex-1 px-2.5 py-1.5 rounded-md text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-400 transition"
            />
            {noteSaving && <span className="h-3 w-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {!note && (
              <button onClick={() => setShowNote(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
