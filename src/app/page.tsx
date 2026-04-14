"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import type { Cart, Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = {};
  if (text) {
    try { payload = JSON.parse(text); }
    catch { throw new Error(`Request failed with status ${response.status}`); }
  }
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

async function parseOptionalCartResponse(response: Response): Promise<{ data: Cart | null }> {
  if (!response.ok) return { data: null };
  return parseJsonResponse<{ data: Cart | null }>(response);
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/[0.08] overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-100 dark:bg-white/[0.04]" />
      <div className="p-3 space-y-2 border-t border-slate-100 dark:border-white/[0.06]">
        <div className="h-3 bg-slate-100 dark:bg-white/[0.06] rounded w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-white/[0.04] rounded w-1/3" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(parseJsonResponse<{ data: Product[]; error?: string }>),
      fetch("/api/cart").then(parseOptionalCartResponse),
    ])
      .then(([productsRes, cartRes]) => {
        if (productsRes.error) throw new Error(productsRes.error);
        setProducts(productsRes.data);
        setCart(cartRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = useCallback(async (productId: string, quantity: number, note?: string) => {
    if (quantity <= 0) return; // note-only calls skipped (handled by modal directly)
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, note }),
    });
    const json = await parseJsonResponse<{ data: Cart; error?: string }>(res);
    if (json.error) throw new Error(json.error);
    setCart(json.data);
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category))).sort()];
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
      (category === "All" || p.category === category);
  });

  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const inStock = products.filter((p) => p.inStock).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f]">
      <Header cartCount={cartCount} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">



        {/* Page header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Menu</h1>
            {!loading && (
              <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
                {inStock} items available
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-8 pr-7 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#12121a] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Category filter — segmented row */}
        <div className="flex items-center gap-1 mb-5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                category === cat
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                  : "bg-white dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">Failed to load menu</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mb-4">
              <Search size={20} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">No items found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="mt-4 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors uppercase tracking-wider"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
