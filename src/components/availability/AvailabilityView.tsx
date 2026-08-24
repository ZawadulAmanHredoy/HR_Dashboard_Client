import { useEffect, useRef, useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { CalendarMonth } from "@/components/availability/CalendarMonth";
import { DayEditor } from "@/components/availability/DayEditor";
import { UpcomingPanel } from "@/components/availability/UpcomingPanel";
import { LegacyGrid } from "@/components/availability/LegacyGrid";
import { useApi } from "@/hooks/useApi";
import { api, endpoints, type AvailabilityMonth, type AvailabilityDay } from "@/lib/api";
import { AVAILABILITY_MONTH } from "@/lib/constants";
import { useProfile } from "@/context/profile-context";

const VIEWS = [
  { value: "calendar", label: "Calendar" },
  { value: "classic", label: "Classic" },
] as const;

type View = (typeof VIEWS)[number]["value"];

export function AvailabilityView() {
  const [view, setView] = useState<View>("calendar");
  const [{ year, month }, setMonth] = useState(AVAILABILITY_MONTH);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { profile } = useProfile();

  const { data, loading, error, refresh } = useApi<AvailabilityMonth>(
    endpoints.availability(year, month),
  );

  const shiftMonth = (delta: number) =>
    setMonth((current) => {
      const next = new Date(current.year, current.month - 1 + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });

  const toggleHoliday = async (date: string) => {
    await api.post("/availability/holidays", { date });
    refresh();
  };

  const [busy, setBusy] = useState(false);

  const createSlot = async (payload: {
    date: string;
    times: string[];
    duration_minutes: number;
    mode: string;
    repeat_weeks: number;
  }) => {
    setBusy(true);
    try {
      const result = await api.post<{ created?: number; skipped?: number }>(
        "/availability/slots",
        payload,
      );
      refresh();
      return result;
    } finally {
      setBusy(false);
    }
  };

  const deleteSlot = async (id: string) => {
    setBusy(true);
    try {
      await api.delete(`/availability/slots/${id}`);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const selectedDay: AvailabilityDay | null = (() => {
    if (!selectedDate) return null;
    const dayNumber = Number(selectedDate.slice(8, 10));
    return data?.days.find((entry) => entry.day === dayNumber) ?? null;
  })();

  // The day editor sits below the calendar; glide it into view as soon as a
  // date is picked so the "Add slot" form is never lost under the fold.
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedDay) {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedDay?.date]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={VIEWS} value={view} onChange={setView} />
        <p className="text-[12px] text-ink-400">
          Slots shown in your local time ({profile?.timezone ?? "GMT+6"})
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-ink-100 px-5 py-16 text-center text-[13px] text-rose-600">
          {error}
        </p>
      ) : view === "calendar" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <CalendarMonth
              year={year}
              month={month}
              days={data?.days ?? []}
              loading={loading}
              onShiftMonth={(delta) => {
                setSelectedDate(null);
                shiftMonth(delta);
              }}
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
            {selectedDay && (
              <div ref={editorRef} className="scroll-mt-4">
                <DayEditor
                  day={selectedDay}
                  busy={busy}
                  onCreate={createSlot}
                  onDelete={deleteSlot}
                  onToggleHoliday={toggleHoliday}
                />
              </div>
            )}
          </div>
          <UpcomingPanel />
        </div>
      ) : (
        <LegacyGrid
          year={year}
          month={month}
          days={data?.days ?? []}
          loading={loading}
          onToggleHoliday={toggleHoliday}
        />
      )}
    </div>
  );
}
