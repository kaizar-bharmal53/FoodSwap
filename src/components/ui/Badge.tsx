import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "yellow" | "red" | "gray" | "blue";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-500/20",
  yellow: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-500/20",
  red:    "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/20",
  gray:   "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400 ring-1 ring-slate-200 dark:ring-white/[0.08]",
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/20",
};

export default function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
