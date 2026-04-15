"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import FoodSwapLogo from "@/components/FoodSwapLogo";

const inputCls = "w-full px-3.5 py-2.5 rounded-md border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500/50 transition-colors text-sm";

function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getRedirect = (role: string) => {
    if (from !== "/") return from;
    return role === "admin" ? "/admin" : "/";
  };

  useEffect(() => {
    if (user) router.replace(getRedirect(user.role));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(email, password);
    if (err) { setError(err); setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3.5 py-2.5">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        <LogIn size={14} />
        Sign in
      </Button>

      <button
        type="button"
        onClick={() => { setEmail("admin@foodswap.com"); setPassword("admin123"); }}
        className="w-full text-center text-xs text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors py-1 font-medium"
      >
        Use demo account → admin@foodswap.com / admin123
      </button>
    </form>
  );
}

function LoginFooter() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const registerHref = from !== "/" ? `/register?from=${encodeURIComponent(from)}` : "/register";
  return (
    <p className="text-center text-sm text-slate-400 mt-5">
      Don&apos;t have an account?{" "}
      <Link href={registerHref} className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
        Create one
      </Link>
    </p>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-[#0a0a0f]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="FoodSwap home">
            <FoodSwapLogo height={36} className="text-slate-900 dark:text-white" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#12121a] rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.02]">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Welcome back</h1>
            <p className="text-xs text-slate-400 mt-0.5">Sign in to your account to continue</p>
          </div>
          <div className="p-6">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.04]" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={
          <p className="text-center text-sm text-slate-400 mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">Create one</Link>
          </p>
        }>
          <LoginFooter />
        </Suspense>
      </div>
    </div>
  );
}
