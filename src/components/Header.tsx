"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  ClipboardList,
  LogOut,
  LogIn,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import FoodSwapLogo from "./FoodSwapLogo";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  cartCount?: number;
}

export default function Header({ cartCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "";

  const isAdmin = user?.role === "admin";

  const baseLinks = [
    { href: "/",     label: "Menu",  icon: Package },
    { href: "/cart", label: "Cart",  icon: ShoppingCart },
  ];
  const adminOnlyLinks = [
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  ];
  const navLinks = [...baseLinks, ...(isAdmin ? adminOnlyLinks : [])];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0a0a0f] border-b border-slate-200 dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center" aria-label="FoodSwap home">
          <FoodSwapLogo height={26} className="text-slate-900 dark:text-white" />
        </Link>

        {/* Segmented nav */}
        <nav className="flex items-center border border-slate-200 dark:border-white/[0.1] rounded-lg overflow-hidden bg-white dark:bg-white/[0.03]">
          {navLinks.map(({ href, label, icon: Icon }, idx) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors duration-100",
                  idx < navLinks.length - 1 && "border-r border-slate-200 dark:border-white/[0.1]",
                  active
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                )}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                <span className="hidden sm:inline">{label}</span>
                {label === "Cart" && cartCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold rounded min-w-[16px] h-4 px-1 flex items-center justify-center",
                    active ? "bg-white/20 text-white" : "bg-brand-500 text-white"
                  )}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />

          {/* Admin panel button */}
          {!loading && isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors border",
                pathname.startsWith("/admin")
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-500/20 hover:bg-brand-100 dark:hover:bg-brand-500/15"
              )}
            >
              <LayoutDashboard size={13} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {!loading && (
            user ? (
              <div className="flex items-center gap-2">

                {/* Customer "My Orders" */}
                {!isAdmin && (
                  <Link
                    href="/orders"
                    className={cn(
                      "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors border",
                      pathname === "/orders"
                        ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-500/20"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <Receipt size={12} />
                    My Orders
                  </Link>
                )}

                {/* Avatar chip — customers only (links to /account) */}
                {!isAdmin && (
                  <Link
                    href="/account"
                    className={cn(
                      "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md border transition-colors",
                      pathname === "/account"
                        ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.1]"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                      pathname === "/account"
                        ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    )}>
                      {initials}
                    </div>
                    <p className={cn(
                      "hidden sm:block text-[12px] font-semibold truncate max-w-[100px]",
                      pathname === "/account"
                        ? "text-white dark:text-slate-900"
                        : "text-slate-900 dark:text-white"
                    )}>
                      {user.name}
                    </p>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
              >
                <LogIn size={13} />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
