import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-ink-200 bg-white p-1",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors",
            option.value === value
              ? "bg-brand-500 text-white shadow-[0_4px_12px_rgba(81,56,238,0.24)]"
              : "text-ink-500 hover:text-ink-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
