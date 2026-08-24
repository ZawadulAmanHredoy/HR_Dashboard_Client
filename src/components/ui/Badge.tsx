import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  brand: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  gray: "bg-ink-100 text-ink-500",
  red: "bg-rose-50 text-rose-600",
} as const;

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
