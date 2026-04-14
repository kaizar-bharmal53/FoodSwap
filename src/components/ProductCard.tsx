"use client";

import { useRef, useState } from "react";
import { Plus, Check, Pencil, Heart } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCents } from "@/lib/utils";
import Badge from "./ui/Badge";
import FoodDetailModal from "./FoodDetailModal";
import { useAuth } from "@/context/AuthContext";

const LONG_PRESS_MS = 500;

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, quantity: number, note?: string) => Promise<void>;
  isAdmin?: boolean;
}

export default function ProductCard({ product, onAddToCart, isAdmin = false }: ProductCardProps) {
  const [addLoading, setAddLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { user, favorites, toggleFavorite } = useAuth();
  const isFav = favorites.includes(product.id);

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await toggleFavorite(product.id);
  };

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startPress = () => {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowDetail(true);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleCardClick = () => {
    if (!didLongPress.current) setShowDetail(true);
    didLongPress.current = false;
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock || addLoading) return;
    setAddLoading(true);
    try {
      await onAddToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    } finally {
      setAddLoading(false);
    }
  };

  const showPhoto = !!product.imageUrl && !imgError;

  return (
    <>
      <div
        className={`
          group relative flex flex-col overflow-hidden cursor-pointer
          rounded-xl
          bg-white dark:bg-[#12121a]
          border border-slate-200 dark:border-white/[0.08]
          hover:border-slate-300 dark:hover:border-white/[0.14]
          shadow-card hover:shadow-card-hover
          transition-all duration-150
          ${!product.inStock ? "opacity-60" : ""}
        `}
        onClick={handleCardClick}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
      >
        {/* Photo area */}
        <div className="relative overflow-hidden bg-slate-100 dark:bg-white/[0.04]" style={{ aspectRatio: "4/3" }}>
          {showPhoto ? (
            <>
              {/* Shimmer shown until image fully loads */}
              {!imgLoaded && (
                <div className="absolute inset-0 img-shimmer" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600" aria-label={product.name}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
            </div>
          )}

          {/* Category badge — top left */}
          <div className="absolute top-2 left-2">
            <Badge variant="gray">{product.category}</Badge>
          </div>

          {/* Favorite button — top right (customers only) */}
          {!isAdmin && user && (
            <button
              onClick={handleFav}
              aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
              className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-slate-200 dark:border-white/[0.1] shadow-sm hover:scale-110 transition-transform"
            >
              <Heart
                size={13}
                strokeWidth={2}
                className={isFav ? "fill-brand-500 text-brand-500" : "text-slate-400 dark:text-slate-500"}
              />
            </button>
          )}

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Badge variant="red">Out of stock</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="min-w-0">
            <h3 className="font-semibold text-[13px] text-slate-900 dark:text-white leading-snug line-clamp-1">
              {product.name}
            </h3>
            <span className="text-[13px] font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCents(product.price)}
            </span>
          </div>

          {isAdmin ? (
            <Link
              href="/admin/products"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Edit ${product.name}`}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 border border-brand-200 dark:border-brand-500/20 transition-colors"
            >
              <Pencil size={11} />
              Edit
            </Link>
          ) : (
            product.inStock && (
              <button
                onClick={handleQuickAdd}
                disabled={addLoading}
                aria-label={`Add ${product.name} to cart`}
                className={`
                  flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center
                  transition-colors duration-100 select-none
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${added
                    ? "bg-brand-500 text-white"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-500 dark:hover:bg-brand-500 dark:hover:text-white"
                  }
                `}
              >
                {addLoading
                  ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : added
                    ? <Check size={13} strokeWidth={3} />
                    : <Plus size={14} strokeWidth={2.5} />
                }
              </button>
            )
          )}
        </div>
      </div>

      {showDetail && (
        <FoodDetailModal
          product={product}
          onClose={() => setShowDetail(false)}
          onAddToCart={onAddToCart}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
