"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check, Loader2, Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCents } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

const CATEGORIES = ["Wraps","Rice","Mezze","Snacks","Breads","Grills","Bowls","Salads","Desserts","Drinks"];
const EMOJIS     = ["🌯","🍛","🧆","🫙","🍚","🥟","🫓","🍢","🔥","🥣","🫕","🍆","🥗","🍮","🍡","🥮","🧋","🍇","☕","🍽️"];

interface ProductForm {
  name: string; price: string; sku: string; description: string;
  category: string; imageEmoji: string; imageUrl: string; inStock: boolean;
}
const emptyForm: ProductForm = {
  name: "", price: "", sku: "", description: "",
  category: "Wraps", imageEmoji: "🍽️", imageUrl: "", inStock: true,
};

const inputCls = "w-full px-3 py-2 rounded-md border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors";

export default function AdminProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEdit]    = useState<Product | null>(null);
  const [form, setForm]           = useState<ProductForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [togglingId, setToggling] = useState<string | null>(null);
  const [error, setError]         = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/products").then(r => r.json()).then(d => {
      setProducts(d.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEdit(null); setForm(emptyForm); setError(""); setShowModal(true); };

  const openEdit = (p: Product) => {
    setEdit(p);
    setForm({
      name: p.name, price: String(p.price / 100), sku: p.sku,
      description: p.description, category: p.category,
      imageEmoji: p.imageEmoji, imageUrl: p.imageUrl ?? "", inStock: p.inStock,
    });
    setError("");
    setShowModal(true);
  };

  const toggleStock = async (p: Product) => {
    setToggling(p.id);
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: !p.inStock }),
    });
    load();
    setToggling(null);
  };

  const handleSave = async () => {
    setError("");
    const priceNum = Math.round(parseFloat(form.price) * 100);
    if (!form.name.trim() || isNaN(priceNum) || priceNum <= 0 || !form.sku.trim()) {
      setError("Name, a valid price, and SKU are required.");
      return;
    }
    setSaving(true);
    const body = {
      name: form.name.trim(), price: priceNum, sku: form.sku.trim(),
      description: form.description.trim(), category: form.category,
      imageEmoji: form.imageEmoji,
      ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
      inStock: form.inStock,
    };
    const url    = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
    const method = editProduct ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setShowModal(false); load(); }
    else { const d = await res.json(); setError(d.error ?? "Failed to save product"); }
  };

  const f = (key: keyof ProductForm, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
            {products.length} items · {products.filter(p => !p.inStock).length} out of stock
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-slate-50/50 dark:bg-white/[0.01]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No products yet — add your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.07]">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-white/[0.08]" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0 border border-slate-200 dark:border-white/[0.08]">
                            {p.imageEmoji}
                          </div>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-slate-400">{p.sku}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="gray">{p.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCents(p.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStock(p)}
                        disabled={togglingId === p.id}
                        aria-label={p.inStock ? "Mark out of stock" : "Mark in stock"}
                        className="inline-flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        {togglingId === p.id
                          ? <Loader2 size={18} className="animate-spin text-slate-400" />
                          : p.inStock
                            ? <ToggleRight size={22} className="text-green-500" />
                            : <ToggleLeft  size={22} className="text-slate-300 dark:text-slate-600" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08] transition-all"
                      >
                        <Pencil size={11} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18181f] rounded-xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200 dark:border-white/[0.08]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {editProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-3.5 max-h-[68vh] overflow-y-auto">
              {error && (
                <div className="px-3.5 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Name *</label>
                  <input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Chicken Shawarma" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Price (AED) *</label>
                  <input value={form.price} onChange={e => f("price", e.target.value)} placeholder="5.99" type="number" min="0" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">SKU *</label>
                  <input value={form.sku} onChange={e => f("sku", e.target.value)} placeholder="WRAP-001" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Category</label>
                  <select value={form.category} onChange={e => f("category", e.target.value)} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Emoji</label>
                  <select value={form.imageEmoji} onChange={e => f("imageEmoji", e.target.value)} className={inputCls}>
                    {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Image URL</label>
                  <input value={form.imageUrl} onChange={e => f("imageUrl", e.target.value)} placeholder="https://example.com/photo.jpg" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Description</label>
                  <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3} placeholder="A brief description…" className={`${inputCls} resize-none`} />
                </div>
                <div className="col-span-2 flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => f("inStock", !form.inStock)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.inStock ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 ${form.inStock ? "translate-x-5" : ""}`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {form.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors border border-slate-200 dark:border-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {editProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
