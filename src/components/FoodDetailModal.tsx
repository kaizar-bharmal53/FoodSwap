"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Minus, ShoppingCart, Tag, Pencil, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCents } from "@/lib/utils";
import Badge from "./ui/Badge";

interface FoodDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number, note?: string) => Promise<void>;
  isAdmin?: boolean;
}

const CATEGORY_BG: Record<string, string> = {
  Wraps:    "cat-bg-wraps",
  Rice:     "cat-bg-rice",
  Mezze:    "cat-bg-mezze",
  Snacks:   "cat-bg-snacks",
  Breads:   "cat-bg-breads",
  Grills:   "cat-bg-grills",
  Bowls:    "cat-bg-bowls",
  Salads:   "cat-bg-salads",
  Desserts: "cat-bg-desserts",
  Drinks:   "cat-bg-drinks",
};

export default function FoodDetailModal({ product, onClose, onAddToCart, isAdmin = false }: FoodDetailModalProps) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [note, setNote] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAddToCart(product.id, qty, note.trim() || undefined);
      setAdded(true);
      setTimeout(() => { setAdded(false); onClose(); }, 900);
    } finally {
      setLoading(false);
    }
  };

  const bg = CATEGORY_BG[product.category] ?? "cat-bg-default";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#18181f] rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200 dark:border-white/[0.08]">

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-md bg-white/90 dark:bg-[#18181f]/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {/* Hero image */}
        <div className={`relative h-52 overflow-hidden ${!product.imageUrl ? bg : ""}`}>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[80px] drop-shadow-md select-none" role="img" aria-label={product.name}>
                {product.imageEmoji}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#18181f] to-transparent pointer-events-none" />
          {!product.inStock && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Badge variant="red">Out of stock</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="gray">{product.category}</Badge>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Tag size={10} />
                  {product.sku}
                </span>
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums flex-shrink-0">
              {formatCents(product.price)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {product.description}
          </p>

          {/* Admin CTA */}
          {isAdmin && (
            <div className="pt-1 space-y-2.5">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                <ShieldCheck size={13} className="text-brand-600 dark:text-brand-400 flex-shrink-0" />
                <p className="text-xs text-brand-700 dark:text-brand-400">
                  You&apos;re viewing as <span className="font-semibold">Administrator</span>. Customers can order this item.
                </p>
              </div>
              <Link
                href="/admin/products"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-md font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm"
              >
                <Pencil size={14} />
                Edit in Admin Panel
              </Link>
            </div>
          )}

          {/* Customer Qty + Add */}
          {!isAdmin && product.inStock && (
            <div className="space-y-3 pt-1">
              {/* Special instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Special instructions <span className="font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. no onions, extra sauce..."
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-md text-sm border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors"
                />
              </div>
            <div className="flex items-center gap-3">
              {/* Qty stepper */}
              <div className="flex items-center border border-slate-200 dark:border-white/[0.1] rounded-md overflow-hidden bg-slate-50 dark:bg-white/[0.04]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease"
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] border-r border-slate-200 dark:border-white/[0.1] transition-colors"
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span className="w-10 text-center text-[15px] font-bold text-slate-900 dark:text-white tabular-nums select-none">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase"
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] border-l border-slate-200 dark:border-white/[0.1] transition-colors"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAdd}
                disabled={loading || added}
                className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-md font-semibold text-sm transition-colors
                  ${added
                    ? "bg-brand-500 text-white"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100"
                  } disabled:opacity-70`}
              >
                {loading
                  ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : added
                    ? "Added to cart ✓"
                    : (
                      <>
                        <ShoppingCart size={15} />
                        Add {qty > 1 ? `${qty} ` : ""}to cart — {formatCents(product.price * qty)}
                      </>
                    )
                }
              </button>
            </div>
            </div>
          )}
        </div>

        <div className="h-safe-bottom sm:hidden" />
      </div>
    </div>
  );
}
