import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  Activity,
  Download,
  Plus,
  Filter,
  Eye,
  Edit3,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Menu } from "@/components/ui/Menu";
import { Segmented } from "@/components/ui/Segmented";
import { ChevronDown, DocIcon, UserIcon, VideoIcon } from "@/components/icons";
import { NewAppointmentModal } from "@/components/dashboard/NewAppointmentModal";
import { useApi } from "@/hooks/useApi";
import {
  api,
  endpoints,
  type Appointment,
  type AppointmentStatus,
  type ClientRecord,
  type ConsultStat,
} from "@/lib/api";
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

const CLIENT_STATUS_TONE = {
  Stable: "green",
  "Follow-up": "amber",
  Closed: "gray",
} as const;

export function DashboardView() {
  return <Overview />;
}

export function AppointmentsView() {
  return <AppointmentSchedule />;
}

/* ---------------------------------------------------------- clients overview */

function Overview() {
  const now = new Date();

  const { data: clientsData } = useApi<ClientRecord[]>(endpoints.clients());
  const { data: statsData } = useApi<ConsultStat[]>(endpoints.stats);
  const { data: monthRows } = useApi<Appointment[]>(
    endpoints.appointments({
      status: "upcoming",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }),
  );

  const clients = clientsData ?? [];
  const stats = statsData ?? [];
  const upcoming = monthRows ?? [];

  const todays = upcoming.filter(
    (row) => row.month === now.getMonth() && row.day === now.getDate(),
  );
  const activeCases = clients.filter((client) => client.status !== "Closed").length;

  const tileOf = (index: number) => stats[index] ?? { label: "—", value: "—", delta: "" };
  const totalConsults = tileOf(0);
  const hoursDelivered = tileOf(1);
  const avgRating = tileOf(2);
  const repeatClients = tileOf(3);

  const analytics = [
    {
      label: "Total Consults",
      value: totalConsults.value,
      sub: totalConsults.delta,
      color: "bg-indigo-500",
    },
    {
      label: "Repeat Clients",
      value: repeatClients.value,
      sub: repeatClients.delta,
      color: "bg-green-500",
    },
    {
      label: "Avg. Rating",
      value: avgRating.value,
      sub: avgRating.delta,
      color: "bg-cyan-400",
    },
  ];

  const schedule = [
    { label: "Morning", count: todays.filter((r) => periodOf(r.start) === "Morning").length },
    { label: "Afternoon", count: todays.filter((r) => periodOf(r.start) === "Afternoon").length },
    { label: "Evening", count: todays.filter((r) => periodOf(r.start) === "Evening").length },
  ];

  const miniStats: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: typeof Users;
  }[] = [
    {
      title: "Total Clients",
      value: clients.length.toLocaleString(),
      change: `${activeCases} active`,
      trend: "up",
      icon: Users,
    },
    {
      title: "Today's Appointments",
      value: String(todays.length),
      change: `${upcoming.length} this month`,
      trend: "up",
      icon: Calendar,
    },
    {
      title: "Active Cases",
      value: String(activeCases),
      change: `${clients.length} registered`,
      trend: "up",
      icon: Activity,
    },
    {
      title: "Hours Delivered",
      value: hoursDelivered.value,
      change: hoursDelivered.delta,
      trend: "up",
      icon: Clock,
    },
  ];

  const activity: { color: string; title: string; time: string }[] = [];
  for (const client of clients.slice(0, 2)) {
    activity.push({
      color: "bg-indigo-500",
      title: "New client registered",
      time: client.lastSeen || "—",
    });
  }
  for (const row of upcoming.slice(0, 3)) {
    activity.push({
      color: "bg-amber-400",
      title: `Appointment booked · ${row.client}`,
      time: `${row.day} ${MONTHS_SHORT[row.month]}, ${row.start}`,
    });
  }

  return (
    <div className="min-h-screen p-0 font-sans text-slate-800 sm:p-8">
      {/* Top header section */}
      <div className="mb-8 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => exportClients(clients)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
        >
          <Download size={16} /> Export
        </button>
        <Link
          to="/client-records"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Client
        </Link>
      </div>

      {/* Monthly analytics overview card */}
      <div className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="text-indigo-500" size={24} /> Monthly Analytics Overview
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Insights for {MONTHS[now.getMonth()]} {now.getFullYear()}
            </p>
          </div>
          <Link
            to="/appointments"
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            View Schedule
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {analytics.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex justify-between items-end">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <h3 className="text-3xl font-bold text-slate-800">{item.value}</h3>
                </div>
              </div>
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${item.color}`}
                  style={{ width: `${barWidth(item.value)}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4-column mini stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {miniStats.map(({ title, value, change, trend, icon: Icon }) => (
          <div
            key={title}
            className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {title}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
              <p
                className={`mt-2 text-xs font-bold ${trend === "up" ? "text-green-500" : "text-red-400"}`}
              >
                {trend === "up" ? "↑" : "↓"} {change}
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-3">
              <Icon size={20} className="text-indigo-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Three-column info */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-slate-700">
            <Calendar size={18} className="text-indigo-500" /> Today&apos;s Schedule
          </div>
          {todays.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">No appointments today.</p>
          ) : (
            <div className="space-y-4">
              {schedule.map((item) => (
                <ScheduleItem key={item.label} label={item.label} count={`${item.count} client${item.count === 1 ? "" : "s"}`} />
              ))}
            </div>
          )}
          <Link
            to="/appointments"
            className="mt-6 block w-full rounded-xl bg-slate-50 py-2 text-center text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
          >
            View Full Schedule
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-slate-700">
            <Activity size={18} className="text-cyan-500" /> Recent Activity
          </div>
          <div className="space-y-6">
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              activity.map((item, index) => (
                <ActivityItem key={index} color={item.color} title={item.title} time={item.time} />
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-slate-700">
            <TrendingUp size={18} className="text-green-500" /> Performance
          </div>
          <div className="space-y-4 text-sm">
            <PerformanceRow label="Total Consults" val={totalConsults.value} color="text-green-500" />
            <PerformanceRow label="Hours Delivered" val={hoursDelivered.value} color="text-green-500" />
            <PerformanceRow label="Repeat Clients" val={repeatClients.value} color="text-indigo-500" />
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-slate-50 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
          >
            View Analytics
          </button>
        </section>
      </div>

      {/* Client records table */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white"
            >
              Clients
            </button>
            <Link
              to="/appointments"
              className="rounded-lg px-6 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Appointments
            </Link>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Client Records</h2>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Filter size={16} /> Advanced Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 pb-4 font-semibold">Client</th>
                <th className="pb-4 font-semibold">ID</th>
                <th className="pb-4 font-semibold">Age</th>
                <th className="pb-4 font-semibold">Issue</th>
                <th className="pb-4 text-center font-semibold">Status</th>
                <th className="pb-4 font-semibold">Last Consult</th>
                <th className="pb-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    No clients yet — they appear here once somebody books you.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <ClientRow key={client.id} client={client} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client }: { client: ClientRecord }) {
  return (
    <tr className="group border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/50">
      <td className="flex items-center gap-3 px-4 py-5">
        {client.avatarUrl ? (
          <img
            src={client.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-600">
            {initials(client.name)}
          </span>
        )}
        <div>
          <p className="font-bold text-slate-700">{client.name}</p>
          <p className="text-xs text-slate-400">{client.email || "No account"}</p>
        </div>
      </td>
      <td className="py-5 font-medium text-slate-500">{client.code ?? "—"}</td>
      <td className="py-5 font-medium text-slate-500">
        {client.age != null ? `${client.age} yrs` : "—"}
      </td>
      <td className="py-5 font-bold text-slate-700">{client.issue || "—"}</td>
      <td className="py-5 text-center">
        <Badge tone={CLIENT_STATUS_TONE[client.status] ?? "gray"}>{client.status}</Badge>
      </td>
      <td className="py-5 font-medium text-slate-500">{client.lastSeen || "—"}</td>
      <td className="py-5 text-right">
        <div className="flex justify-end gap-1 text-slate-400">
          <Link to={`/client-records/${encodeURIComponent(client.id)}`} className="p-1 transition-colors hover:text-indigo-600">
            <Eye size={18} />
          </Link>
          <Link to={`/client-records/${encodeURIComponent(client.id)}`} className="p-1 transition-colors hover:text-indigo-600">
            <Edit3 size={18} />
          </Link>
          <button type="button" className="p-1 transition-colors hover:text-slate-600">
            <MoreVertical size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ScheduleItem({ label, count }: { label: string; count: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1 text-sm last:border-0">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-700">{count}</span>
    </div>
  );
}

function ActivityItem({ color, title, time }: { color: string; title: string; time: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}

function PerformanceRow({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-medium text-slate-500">{label}</span>
      <span className={`font-bold ${color}`}>{val}</span>
    </div>
  );
}

function periodOf(start: string) {
  const hour = parseInt(String(start).split(":")[0] ?? "0", 10);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function barWidth(value: string) {
  const number = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(number)) return 70;
  return Math.min(95, Math.max(15, number));
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function exportClients(clients: ClientRecord[]) {
  const rows = [
    ["Client", "ID", "Email", "Issue", "Status", "Sessions", "Last consult"],
    ...clients.map((client) => [
      client.name,
      client.code ?? "",
      client.email,
      client.issue ?? "",
      client.status,
      String(client.sessions),
      client.lastSeen,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "clients.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------- on the "appointments" view */

function AppointmentSchedule() {
  const [tab, setTab] = useState<AppointmentStatus>("upcoming");
  const [selected, setSelected] = useState(MONTH_OPTIONS[1]);
  const { month, year } = selected;
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [noteTarget, setNoteTarget] = useState<Appointment | null>(null);

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

  /** After create/edit, jump the picker to that appointment's month + tab. */
  const handleSaved = (saved: Appointment) => {
    const existing = MONTH_OPTIONS.find(
      (option) => option.month === saved.month && option.year === saved.year,
    );
    setSelected(
      existing ?? {
        label: `${MONTHS_SHORT[saved.month]} ${String(saved.year).slice(2)}`,
        month: saved.month,
        year: saved.year,
      },
    );
    setTab(saved.status === "cancelled" ? "cancelled" : "upcoming");
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented options={TABS} value={tab} onChange={(value) => setTab(value)} />
        </div>

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

      {/* No overflow-hidden here: the Edit menu must be able to render
          outside the card bounds without being clipped. */}
      <div className="rounded-2xl border border-ink-100">
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

                    {row.status !== "cancelled" && (
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
                          {
                            label: "Reschedule",
                            onSelect: () => setEditTarget(row),
                          },
                          {
                            label: "Add note",
                            onSelect: () => setNoteTarget(row),
                          },
                          {
                            label: "Cancel appointment",
                            danger: true,
                            onSelect: () => void cancelAppointment(row.id),
                          },
                        ]}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <NewAppointmentModal
        key={editTarget?.id ?? "new"}
        open={modalOpen || editTarget !== null}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        onCreated={handleSaved}
        appointment={editTarget}
      />

      {noteTarget ? (
        <NoteModal
          target={noteTarget}
          onClose={() => setNoteTarget(null)}
          onSaved={() => {
            setNoteTarget(null);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

/** Small dialog for the "Add note" action on an appointment row. */
function NoteModal({
  target,
  onClose,
  onSaved,
}: {
  target: Appointment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/appointments/${target.id}`, {
        note: String(new FormData(event.currentTarget).get("note") ?? ""),
      });
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add note"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-pop max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <h2 className="text-[17px] font-semibold text-ink-900">Add note</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Private note for {target.client}&apos;s appointment.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <textarea
            name="note"
            rows={4}
            autoFocus
            defaultValue={target.note ?? ""}
            placeholder="e.g. Discussed internship plan, follow up next month"
            className="w-full rounded-xl border border-ink-200 p-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
          />
          {error ? <p className="text-[12px] text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save note"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}