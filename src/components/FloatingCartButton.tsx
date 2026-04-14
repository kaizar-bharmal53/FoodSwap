"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface FloatingCartButtonProps {
  cartCount: number;
  cartTotal?: number;
}

export default function FloatingCartButton({ cartCount, cartTotal }: FloatingCartButtonProps) {
  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-4 fade-in duration-300">
      <Link
        href="/cart"
        className="group flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 pl-4 pr-3 py-3 rounded-2xl shadow-2xl shadow-slate-900/30 dark:shadow-black/40 hover:bg-slate-700 dark:hover:bg-slate-100 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
      >
        <div className="relative flex-shrink-0">
          <ShoppingCart size={20} strokeWidth={2} />
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
            {cartCount === 1 ? "1 item" : `${cartCount} items`}
          </span>
          {cartTotal !== undefined && (
            <span className="text-sm font-bold">
              ${cartTotal.toFixed(2)}
            </span>
          )}
          {cartTotal === undefined && (
            <span className="text-sm font-bold">View Cart</span>
          )}
        </div>

        <div className="w-6 h-6 rounded-lg bg-white/10 dark:bg-slate-900/10 flex items-center justify-center ml-1 group-hover:bg-white/20 dark:group-hover:bg-slate-900/20 transition-colors">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5H8M5 2L8 5L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </Link>
    </div>
  );
}
