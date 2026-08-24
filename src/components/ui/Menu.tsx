import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "@/components/icons";

export type MenuItem = {
  label: string;
  danger?: boolean;
  onSelect?: () => void;
};

export function Menu({
  label,
  items,
  align = "right",
  className,
  panelClassName,
  showChevron = true,
  onSelect,
}: {
  label: ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
  showChevron?: boolean;
  onSelect?: (item: MenuItem) => void;
}) {
  const [open, setOpen] = useState(false);
  // Flip the panel above the trigger when the space below is too tight —
  // measured against both the viewport and any clipping ancestor
  // (overflow-hidden/auto card) so the options can never be cut off.
  const [dropUp, setDropUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && root.current) {
      const rect = root.current.getBoundingClientRect();
      const needed = items.length * 38 + 16;

      let limitBottom = window.innerHeight;
      let limitTop = 0;
      let node: HTMLElement | null = root.current.parentElement;
      while (node) {
        const style = getComputedStyle(node);
        if (/(hidden|clip|auto|scroll)/.test(style.overflow + style.overflowX)) {
          const box = node.getBoundingClientRect();
          limitBottom = Math.min(limitBottom, box.bottom);
          limitTop = Math.max(limitTop, box.top);
          break;
        }
        node = node.parentElement;
      }

      const roomBelow = limitBottom - rect.bottom;
      const roomAbove = rect.bottom - rect.height - limitTop;
      setDropUp(roomBelow < needed && roomAbove > needed);
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
          className,
        )}
      >
        {label}
        {showChevron ? (
          <ChevronDown
            width={16}
            height={16}
            className={cn("transition-transform", open && "rotate-180")}
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-30 min-w-[160px] overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-pop",
            dropUp ? "bottom-full mb-2" : "mt-2",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                item.onSelect?.();
                onSelect?.(item);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-ink-100",
                item.danger ? "text-rose-600" : "text-ink-700",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
