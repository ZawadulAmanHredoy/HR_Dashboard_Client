import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { AvailabilityDay } from "@/lib/api";

const DURATIONS = [30, 45, 60];
const MODES = ["Online", "In person"];

export type SlotPayload = {
  date: string;
  times: string[];
  duration_minutes: number;
  mode: string;
  repeat_weeks: number;
};

export function DayEditor({
  day,
  busy,
  onCreate,
  onDelete,
  onToggleHoliday,
}: {
  day: AvailabilityDay;
  busy: boolean;
  onCreate: (payload: SlotPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleHoliday: (date: string) => Promise<void>;
}) {
  const [time, setTime] = useState("17:00");
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState<string>("Online");
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const weekday = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const submit = async () => {
    setError(null);
    try {
      await onCreate({
        date: day.date,
        times: [time],
        duration_minutes: duration,
        mode,
        repeat_weeks: repeat ? 3 : 0,
      });
      setTime("");
      setRepeat(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the slot");
    }
  };

  const remove = async (id: string) => {
    setError(null);
    setRemovingId(id);
    try {
      await onDelete(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the slot");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-ink-900">
          {weekday}
          {day.holiday && (
            <span className="ml-2 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-400">
              Holiday
            </span>
          )}
        </h3>
        <Button
          size="sm"
          variant={day.holiday ? "outline" : "ghost"}
          disabled={busy}
          onClick={() => onToggleHoliday(day.date).catch((e) =>
            setError(e instanceof Error ? e.message : "Could not update holiday"),
          )}
        >
          {day.holiday ? "Remove holiday" : "Mark as holiday"}
        </Button>
      </div>

      {!day.holiday && (
        <>
          {day.slots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {day.slots.map((slot) => (
                <span
                  key={slot.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-500",
                    removingId === slot.id && "opacity-40",
                  )}
                >
                  {slot.start} - {slot.end}
                  <button
                    type="button"
                    aria-label={`Remove ${slot.start} slot`}
                    disabled={busy || removingId === slot.id}
                    onClick={() => remove(slot.id)}
                    className="text-brand-300 transition-colors hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (time) submit();
            }}
          >
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-[12px] text-ink-900 outline-none focus:border-brand-400"
              required
            />
            <select
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-[12px] text-ink-700 outline-none focus:border-brand-400"
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-[12px] text-ink-700 outline-none focus:border-brand-400"
            >
              {MODES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-500">
              <input
                type="checkbox"
                checked={repeat}
                onChange={(event) => setRepeat(event.target.checked)}
                className="accent-brand-500"
              />
              Repeat ×4 weeks
            </label>
            <Button size="sm" type="submit" disabled={busy || !time}>
              Add slot
            </Button>
          </form>
        </>
      )}

      {error && <p className="mt-2 text-[12px] text-rose-600">{error}</p>}
    </div>
  );
}
