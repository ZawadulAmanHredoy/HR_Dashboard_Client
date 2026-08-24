import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { AvailabilityDay } from "@/lib/api";
import { WEEKDAYS_SUN, daysInMonth, monthMatrix } from "@/lib/date";

export function LegacyGrid({
  year,
  month,
  days,
  loading,
  onToggleHoliday,
}: {
  year: number;
  /** 1-indexed, as the API returns it */
  month: number;
  days: AvailabilityDay[];
  loading: boolean;
  onToggleHoliday: (date: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState(10);
  const [markingHolidays, setMarkingHolidays] = useState(false);

  const total = daysInMonth(year, month - 1);
  const weeks = monthMatrix(year, month - 1, 0).filter((week) =>
    week.some((cell) => cell.inMonth),
  );
  const byDay = new Map(days.map((entry) => [entry.day, entry]));

  return (
    <div className={cn("space-y-4", loading && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-[13px] font-medium text-ink-700">
            Online Consult
          </span>
          <div className="scroll-slim flex gap-1 overflow-x-auto pb-1">
            {Array.from({ length: total }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "h-7 w-7 shrink-0 rounded-md text-[11px] font-medium transition-colors",
                  day === selectedDay
                    ? "bg-brand-500 text-white"
                    : byDay.get(day)?.holiday
                      ? "bg-ink-100 text-ink-400"
                      : "text-ink-500 hover:bg-ink-100",
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          variant={markingHolidays ? "primary" : "outline"}
          onClick={() => setMarkingHolidays((v) => !v)}
        >
          {markingHolidays ? "Done marking" : "Mark Holidays"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-100">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-7 border-b border-ink-100">
            {WEEKDAYS_SUN.map((day) => (
              <div
                key={day}
                className="px-3 py-2.5 text-center text-[11px] font-semibold tracking-wide text-ink-400"
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7 border-b border-ink-100 last:border-b-0"
            >
              {week.map((cell) => {
                const entry = cell.inMonth ? byDay.get(cell.day) : undefined;
                const holiday = Boolean(entry?.holiday);

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={!cell.inMonth || !markingHolidays}
                    onClick={() => entry && onToggleHoliday(entry.date)}
                    className={cn(
                      "min-h-[104px] border-r border-ink-100 p-2.5 text-left align-top last:border-r-0",
                      !cell.inMonth && "bg-ink-100/30",
                      holiday && "bg-ink-100/70",
                      markingHolidays && cell.inMonth && "cursor-pointer hover:bg-brand-50",
                      cell.inMonth &&
                        cell.day === selectedDay &&
                        "ring-1 ring-inset ring-brand-400",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[12px] font-medium",
                        cell.inMonth ? "text-ink-700" : "text-ink-200",
                      )}
                    >
                      {cell.day}
                    </span>

                    {holiday ? (
                      <p className="mt-6 text-center text-[12px] text-ink-400">
                        Holiday
                      </p>
                    ) : entry?.slots.length ? (
                      <div className="mt-1.5 space-y-1">
                        <p className="text-[11px] font-medium text-brand-500">
                          Online
                        </p>
                        {entry.slots.map((slot) => (
                          <p key={slot.id} className="text-[11px] text-ink-500">
                            {slot.start} - {slot.end}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
