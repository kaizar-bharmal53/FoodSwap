"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ClipboardList, Tag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import FoodSwapLogo from "@/components/FoodSwapLogo";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin",             label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin/products",    label: "Products",   icon: Package },
  { href: "/admin/orders",      label: "Orders",     icon: ClipboardList },
  { href: "/admin/promotions",  label: "Promotions", icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0f]">
        <span className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-52 border-r border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d0d18] fixed inset-y-0 z-30">

        {/* Brand */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-white/[0.08] flex-shrink-0">
          <FoodSwapLogo height={26} className="text-slate-900 dark:text-white" />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-px overflow-y-auto pt-3">
          {adminNav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Exit to store */}
        <div className="p-2 pb-3 border-t border-slate-200 dark:border-white/[0.08]">
          <Link
            href="/"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
          >
            Exit to Store
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-52 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d0d18] flex items-center px-4 sm:px-6 gap-4">

          {/* Mobile nav — scrollable segmented strip */}
          <nav className="flex md:hidden items-center border border-slate-200 dark:border-white/[0.1] rounded-lg overflow-x-auto flex-shrink-0 max-w-[calc(100vw-140px)]" style={{ scrollbarWidth: "none" }}>
            {adminNav.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors border-r last:border-r-0 border-slate-200 dark:border-white/[0.1] whitespace-nowrap flex-shrink-0",
                    active
                      ? "bg-brand-600 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {/* Exit button — always visible in top bar */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
            >
              <span>Exit</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-[#0d0d18] border-t border-slate-200 dark:border-white/[0.08] flex">
        {adminNav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                active
                  ? "text-brand-500"
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V9l7-7 7 7v10a2 2 0 0 1-2 2h-4"/><polyline points="9 21 9 12 15 12 15 21"/></svg>
          Store
        </Link>
      </nav>
    </div>
  );
}
