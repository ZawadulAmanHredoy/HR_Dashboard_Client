import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-100 bg-white shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
