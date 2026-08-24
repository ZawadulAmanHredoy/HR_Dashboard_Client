import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { AvailabilityDay } from "@/lib/api";
import { WEEKDAYS_MON, monthLabel, monthMatrix } from "@/lib/date";

export function CalendarMonth({
  year,
  month,
  days,
  loading,
  onShiftMonth,
  selected,
  onSelect,
}: {
  year: number;
  /** 1-indexed, as the API returns it */
  month: number;
  days: AvailabilityDay[];
  loading: boolean;
  onShiftMonth: (delta: number) => void;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const weeks = monthMatrix(year, month - 1, 1);
  const byDay = new Map(days.map((entry) => [entry.day, entry]));

  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold text-ink-900">
          {monthLabel(year, month - 1)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onShiftMonth(-1)}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <ChevronLeft width={16} height={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onShiftMonth(1)}
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <ChevronRight width={16} height={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 pb-2">
        {WEEKDAYS_MON.map((day) => (
          <div key={day} className="text-center text-[11px] font-medium text-ink-400">
            {day}
          </div>
        ))}
      </div>

      <div className={cn("grid grid-cols-7 gap-1", loading && "opacity-50")}>
        {weeks.flat().map((cell) => {
          const entry = cell.inMonth ? byDay.get(cell.day) : undefined;
          const isSelected = cell.key === selected;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => cell.inMonth && onSelect(cell.key)}
              className={cn(
                "flex h-[72px] flex-col rounded-xl border p-1.5 text-left transition-colors",
                cell.inMonth
                  ? "border-ink-100 hover:border-brand-300"
                  : "border-transparent",
                isSelected && "border-brand-400 bg-brand-50",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  cell.inMonth ? "text-ink-700" : "text-ink-200",
                )}
              >
                {String(cell.day).padStart(2, "0")}
              </span>

              {entry?.holiday ? (
                <span className="mt-1 rounded-md bg-ink-100 px-1 py-0.5 text-[9px] text-ink-400">
                  Holiday
                </span>
              ) : (
                <span className="mt-1 flex flex-wrap gap-0.5">
                  {entry?.slots.map((slot) => (
                    <span
                      key={slot.id}
                      className="rounded-[4px] bg-brand-500 px-1 py-[3px] text-[8px] font-medium leading-none text-white"
                    >
                      {slot.start.replace(":00", "")}
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
