import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { Segmented } from "@/components/ui/Segmented";
import { ChevronDown, DocIcon, UserIcon, VideoIcon } from "@/components/icons";
import { NewAppointmentModal } from "@/components/dashboard/NewAppointmentModal";
import { useApi } from "@/hooks/useApi";
import { api, endpoints, type Appointment, type AppointmentStatus } from "@/lib/api";
import { MONTHS, MONTHS_SHORT, weekdayShort } from "@/lib/date";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies readonly { value: AppointmentStatus; label: string }[];

// Keep the picker anchored on the real current month so client bookings
// made "today" are visible without touching constants each month.
const MONTH_OPTIONS = [-1, 0, 1, 2].map((offset) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return {
    label: `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    month: d.getMonth(),
    year: d.getFullYear(),
  };
});

export function DashboardView() {
  const [tab, setTab] = useState<AppointmentStatus>("upcoming");
  const [selected, setSelected] = useState(MONTH_OPTIONS[1]);
  const { month, year } = selected;
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refresh } = useApi<Appointment[]>(
    endpoints.appointments({ status: tab, year, month: month + 1 }),
  );

  const groups = useMemo(() => {
    const byMonth = new Map<number, Appointment[]>();
    for (const row of data ?? []) {
      const list = byMonth.get(row.month) ?? [];
      list.push(row);
      byMonth.set(row.month, list);
    }
    return [...byMonth.entries()];
  }, [data]);

  const monthLabel = selected.label;

  const cancelAppointment = async (id: string) => {
    await api.patch(`/appointments/${id}`, { status: "cancelled" });
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={TABS} value={tab} onChange={(value) => setTab(value)} />

        <div className="flex items-center gap-2">
          <Menu
            align="right"
            className="h-10 gap-2 rounded-xl bg-brand-500 px-3.5 text-[13px] text-white hover:bg-brand-600"
            label={monthLabel}
            items={MONTH_OPTIONS.map((option) => ({
              label: option.label,
              onSelect: () => setSelected(option),
            }))}
          />
          <Button onClick={() => setModalOpen(true)}>
            <span className="text-base leading-none">+</span> New Appointment
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100">
        {loading ? (
          <ul>
            {[0, 1, 2].map((row) => (
              <li
                key={row}
                className="flex items-center gap-4 border-b border-ink-100 px-4 py-4 last:border-b-0"
              >
                <div className="h-9 w-11 shrink-0 animate-pulse rounded-lg bg-ink-100" />
                <div className="h-9 flex-1 animate-pulse rounded-lg bg-ink-100" />
                <div className="h-8 w-16 animate-pulse rounded-lg bg-ink-100" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[13px] text-rose-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="px-5 py-16 text-center text-[13px] text-ink-500">
            No {tab} appointments for this period.
          </p>
        ) : (
          groups.map(([groupMonth, rows], groupIndex) => (
            <section key={groupMonth}>
              {groupIndex > 0 ? (
                <h3 className="border-y border-ink-100 bg-white px-5 py-3 text-[13px] font-semibold text-ink-900">
                  {MONTHS[groupMonth]}&apos;{String(year).slice(2)}
                </h3>
              ) : null}

              <ul>
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="group flex items-center gap-4 border-b border-ink-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-ink-100/50"
                  >
                    <div className="w-11 shrink-0 text-center">
                      <p className="text-[11px] text-ink-400">
                        {weekdayShort(row.year, row.month, row.day)}
                      </p>
                      <p className="text-[17px] font-semibold leading-tight text-ink-900">
                        {String(row.day).padStart(2, "0")}
                      </p>
                    </div>

                    <div className="h-9 w-px bg-ink-100" />

                    <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink-900">
                          {row.start} - {row.end}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-500">
                          <UserIcon width={13} height={13} />
                          {row.client}
                        </p>
                        {row.registered && row.clientEmail ? (
                          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-brand-500">
                            {row.clientEmail}
                          </p>
                        ) : null}
                        {row.mode === "Online" && row.meetingLink ? (
                          <a
                            href={row.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-600"
                            title={row.meetingLink}
                          >
                            <VideoIcon width={12} height={12} />
                            Join meeting
                          </a>
                        ) : null}
                      </div>

                      <p className="text-[12px] text-ink-500">
                        Issue: <span className="text-ink-700">{row.issue}</span>
                      </p>

                      {row.documents ? (
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-left text-[12px] font-medium text-brand-500 underline underline-offset-2 hover:text-brand-600"
                          >
                            <DocIcon width={13} height={13} />
                            View Documents
                          </button>
                          {(row.attachments?.length ?? 0) > 0 ? (
                            <ul className="mt-1 space-y-0.5">
                              {row.attachments!.map((a) => (
                                <li
                                  key={a.cv_id}
                                  className="truncate text-[11px] text-ink-500"
                                  title={a.title}
                                >
                                  • {a.title}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[12px] text-ink-400">-</span>
                      )}
                    </div>

                    <Menu
                      align="right"
                      showChevron={false}
                      className="h-8 gap-2 border border-ink-200 px-3 text-[12px] text-ink-700 hover:border-brand-300 hover:text-brand-600"
                      label={
                        <>
                          Edit
                          <ChevronDown width={14} height={14} />
                        </>
                      }
                      items={[
                        { label: "Reschedule" },
                        { label: "Add note" },
                        {
                          label: "Cancel appointment",
                          danger: true,
                          onSelect: () => void cancelAppointment(row.id),
                        },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <NewAppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refresh}
      />
    </div>
  );
}
