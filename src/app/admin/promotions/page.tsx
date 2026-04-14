"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, AlertCircle } from "lucide-react";
import type { PromoCode } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const inputCls =
  "w-full px-3 py-2.5 rounded-md text-sm bg-white dark:bg-[#0f0f17] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition";

const EMPTY_FORM = {
  code: "",
  type: "percent" as "percent" | "flat",
  value: "",
  maxUses: "",
  expiresAt: "",
};

export default function PromotionsPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/promos")
      .then(r => r.json())
      .then(j => setPromos(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    setSaving(true);
    setError(null);
    const body = {
      code: form.code.trim(),
      type: form.type,
      value: form.type === "percent"
        ? Math.round(parseFloat(form.value))
        : Math.round(parseFloat(form.value) * 100), // AED → cents
      maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
      expiresAt: form.expiresAt || undefined,
      active: true,
    };
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setPromos(prev => [json.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: PromoCode) => {
    const res = await fetch(`/api/admin/promos/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !promo.active }),
    });
    const json = await res.json();
    if (!json.error) setPromos(prev => prev.map(p => p.id === promo.id ? json.data : p));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  const formatValue = (p: PromoCode) =>
    p.type === "percent" ? `${p.value}% off` : `AED ${(p.value / 100).toFixed(2)} off`;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Promotions</h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">Manage discount codes</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
        >
          <Plus size={15} />
          New Code
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discount</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uses</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expires</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="h-4 rounded bg-slate-100 dark:bg-white/[0.05] animate-pulse w-3/4" />
                    </td>
                  </tr>
                ))
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Tag size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-400">No promo codes yet</p>
                  </td>
                </tr>
              ) : (
                promos.map(promo => (
                  <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">{promo.code}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{formatValue(promo)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                      {promo.usedCount}{promo.maxUses !== undefined ? ` / ${promo.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {promo.expiresAt ? formatDate(promo.expiresAt) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleToggle(promo)} className="flex items-center gap-1.5 text-xs font-semibold transition-colors">
                        {promo.active
                          ? <><ToggleRight size={18} className="text-brand-500" /><span className="text-brand-600 dark:text-brand-400">Active</span></>
                          : <><ToggleLeft size={18} className="text-slate-300 dark:text-slate-600" /><span className="text-slate-400">Inactive</span></>
                        }
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">New Promo Code</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Code</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  className={inputCls + " font-mono uppercase"}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as "percent" | "flat" }))}
                    className={inputCls}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Fixed (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Value ({form.type === "percent" ? "%" : "AED"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={form.type === "percent" ? "100" : undefined}
                    step={form.type === "percent" ? "1" : "0.01"}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === "percent" ? "20" : "10.00"}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Max Uses (optional)</label>
                  <input
                    type="number" min="1"
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Expires (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md px-3 py-2">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-md text-sm font-semibold border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-md text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
