import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  FileText,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { api, endpoints, type Appointment, type ClientRecord, type ClientStatus } from "@/lib/api";
import { cn } from "@/lib/cn";

export const CLIENT_STATUS_TONE = {
  Stable: "green",
  "Follow-up": "amber",
  Closed: "gray",
} as const;

type Tab = "All" | "Yesterday" | "Today" | "Past";

const TABS: Tab[] = ["All", "Yesterday", "Today", "Past"];

const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const TODAY_KEY = keyOf(new Date());

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const YESTERDAY_KEY = keyOf(yesterday);

/** Appointments carry an ISO "YYYY-MM-DD" date, so the relative tabs are string compares. */
function matchesTab(date: string, tab: Tab) {
  switch (tab) {
    case "Today":
      return date === TODAY_KEY;
    case "Yesterday":
      return date === YESTERDAY_KEY;
    case "Past":
      return date < YESTERDAY_KEY;
    default:
      return true;
  }
}

function dayParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return {
    weekday: parsed.toLocaleDateString("en-US", { weekday: "short" }),
    day,
  };
}

export default function ClientRecordsPage() {
  usePageTitle("Client Records");

  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [adding, setAdding] = useState(false);

  const {
    data: clientsData,
    loading: clientsLoading,
    error: clientsError,
    refresh: refreshClients,
  } = useApi<ClientRecord[]>(endpoints.clients());

  const { data: appointmentsData, loading: apptsLoading, error: apptsError } = useApi<
    Appointment[]
  >(endpoints.appointments({}));

  const clients = clientsData ?? [];
  const appointments = appointmentsData ?? [];

  const statusCounts = useMemo(
    () => ({
      Stable: clients.filter((client) => client.status === "Stable").length,
      "Follow-up": clients.filter((client) => client.status === "Follow-up").length,
      Closed: clients.filter((client) => client.status === "Closed").length,
    }),
    [clients],
  );

  const tableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter(
      (client) =>
        (statusFilter === "all" || client.status === statusFilter) &&
        (!q ||
          [client.name, client.email, client.phone, client.code ?? "", client.issue ?? ""].some(
            (value) => value.toLowerCase().includes(q),
          )),
    );
  }, [clients, search, statusFilter]);

  const cardRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments
      .filter((row) => matchesTab(row.date, tab))
      .filter(
        (row) =>
          !q ||
          row.client.toLowerCase().includes(q) ||
          row.issue.toLowerCase().includes(q),
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }, [appointments, tab, search]);

  const statusLabel = statusFilter === "all" ? "All Status" : statusFilter;

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-ink-500">
          Manage and view all client records
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-ink-900">Client Records</h1>
          {tab !== "All" ? (
            <label className="relative sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or issue"
                className="h-10 w-full rounded-xl border border-ink-200 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
              />
            </label>
          ) : null}
        </div>
      </header>

      {/* Tabs + add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-canvas p-1.5">
          {TABS.map((tabLabel) => (
            <button
              key={tabLabel}
              type="button"
              onClick={() => setTab(tabLabel)}
              className={cn(
                "rounded-lg px-8 py-2.5 text-sm font-medium transition-all duration-200",
                tab === tabLabel
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-400 hover:text-ink-600",
              )}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {tab === "All" ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600"
          >
            <UserPlus size={18} /> Add New Client
          </button>
        ) : null}
      </div>

      <AddClientModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={() => {
          refreshClients();
          setAdding(false);
          setSearch("");
          setStatusFilter("all");
        }}
      />

      {tab === "All" ? (
        <>
          {/* Summary stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clientsLoading
              ? [0, 1, 2, 3].map((row) => (
                  <div key={row} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                    <div className="h-8 w-12 animate-pulse rounded-lg bg-ink-100" />
                    <div className="mt-2 h-3 w-20 animate-pulse rounded bg-ink-100" />
                  </div>
                ))
              : [
                  { label: "Total Clients", value: clients.length },
                  { label: "Stable", value: statusCounts.Stable },
                  { label: "Follow-up", value: statusCounts["Follow-up"] },
                  { label: "Closed", value: statusCounts.Closed },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm"
                  >
                    <p className="text-2xl font-bold text-ink-900">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
          </div>

          {/* Client table */}
          <div className="rounded-[2rem] border border-ink-100 bg-white p-8 shadow-sm">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink-900">Client Records</h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search patients..."
                    className="w-64 rounded-xl border border-ink-100 bg-ink-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <Menu
                  align="right"
                  className="flex items-center gap-2 rounded-xl border border-ink-100 px-4 py-2 text-sm font-semibold text-ink-500 hover:bg-ink-50"
                  label={statusLabel}
                  items={[
                    { label: "All Status", onSelect: () => setStatusFilter("all") },
                    { label: "Stable", onSelect: () => setStatusFilter("Stable") },
                    { label: "Follow-up", onSelect: () => setStatusFilter("Follow-up") },
                    { label: "Closed", onSelect: () => setStatusFilter("Closed") },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left">
                <thead>
                  <tr className="border-b border-ink-100 text-xs font-bold uppercase tracking-wider text-ink-400">
                    <th className="px-2 pb-4 font-semibold">Patient</th>
                    <th className="pb-4 font-semibold">Contact</th>
                    <th className="pb-4 font-semibold">Issue</th>
                    <th className="pb-4 text-center font-semibold">Status</th>
                    <th className="pb-4 font-semibold">Last Visit</th>
                    <th className="pb-4 font-semibold">Next Appointment</th>
                    <th className="pb-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {clientsLoading ? (
                    [0, 1, 2, 3].map((row) => (
                      <tr key={row} className="border-b border-ink-50 last:border-0">
                        <td colSpan={7} className="px-5 py-5">
                          <div className="h-8 animate-pulse rounded-lg bg-ink-100" />
                        </td>
                      </tr>
                    ))
                  ) : clientsError ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-[13px] text-rose-600">
                        {clientsError}
                      </td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-[13px] text-ink-500">
                        {search || statusFilter !== "all"
                          ? "No clients match the current filters."
                          : "No clients yet — they appear here once somebody books you."}
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-ink-50 transition-colors last:border-0 hover:bg-ink-50/50"
                      >
                        <td className="px-2 py-5">
                          <Link
                            to={`/client-records/${encodeURIComponent(client.id)}`}
                            className="flex items-center gap-4"
                          >
                            {client.avatarUrl ? (
                              <img
                                src={client.avatarUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-500">
                                {initials(client.name)}
                              </span>
                            )}
                            <div>
                              <div className="font-bold text-ink-900">{client.name}</div>
                              <div className="mt-0.5 text-xs font-medium text-ink-400">
                                {client.code ?? "—"} &middot;{" "}
                                {client.age != null ? `${client.age}y` : "—"} &middot;{" "}
                                {client.jobTitle || "—"}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-ink-600">
                              <Phone size={12} className="text-ink-400" /> {client.phone || "—"}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-ink-600">
                              <Mail size={12} className="text-ink-400" /> {client.email || "—"}
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <span className="font-semibold text-ink-600">
                            {client.issue || "—"}
                          </span>
                        </td>
                        <td className="py-5 text-center">
                          <Badge
                            tone={CLIENT_STATUS_TONE[client.status] ?? "gray"}
                            className="px-4 uppercase tracking-widest"
                          >
                            {client.status}
                          </Badge>
                        </td>
                        <td className="py-5 font-semibold text-ink-500">
                          {client.lastSeen || "—"}
                        </td>
                        <td className="py-5 font-semibold text-ink-500">
                          {client.nextAppointment || "—"}
                        </td>
                        <td className="py-5 text-right">
                          <Link
                            to={`/client-records/${encodeURIComponent(client.id)}`}
                            className="inline-flex p-2 text-ink-400 transition-colors hover:text-ink-600"
                          >
                            <MoreHorizontal size={20} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Cards view for the date-filtered tabs */
        <div className="scroll-slim max-h-[600px] space-y-4 overflow-y-auto pr-2">
          {apptsLoading ? (
            [0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex items-center gap-6 rounded-2xl border border-ink-100 bg-white p-4"
              >
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-ink-100" />
                <div className="flex-1 animate-pulse space-y-2">
                  <div className="h-4 w-1/3 rounded-lg bg-ink-100" />
                  <div className="h-4 w-1/4 rounded-lg bg-ink-100" />
                </div>
              </div>
            ))
          ) : apptsError ? (
            <p className="rounded-2xl border border-ink-100 bg-white px-5 py-14 text-center text-[13px] text-rose-600">
              {apptsError}
            </p>
          ) : cardRecords.length === 0 ? (
            <p className="rounded-2xl border border-ink-100 bg-white px-5 py-14 text-center text-[13px] text-ink-500">
              {search
                ? `No appointments match "${search}".`
                : `No ${tab.toLowerCase()} appointments.`}
            </p>
          ) : (
            cardRecords.map((record) => {
              const { weekday, day } = dayParts(record.date);
              const cancelled = record.status === "cancelled";
              return (
                <div
                  key={record.id}
                  className={cn(
                    "group flex items-center rounded-2xl border bg-white p-4 transition-shadow duration-300 hover:shadow-card",
                    cancelled && "opacity-60",
                  )}
                >
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-canvas">
                    <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
                      {weekday}
                    </span>
                    <span className="text-2xl font-bold text-ink-900">{day}</span>
                  </div>

                  <div className="mx-6 h-12 w-px bg-ink-100" />

                  <div className="grid flex-1 grid-cols-1 gap-y-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-ink-500">
                        <Clock size={18} className="text-ink-400" />
                        <span className="text-sm font-medium">
                          {record.start} - {record.end}
                        </span>
                        {cancelled ? (
                          <Badge tone="red" className="ml-1">
                            Cancelled
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-ink-500">
                        <User size={18} className="text-ink-400" />
                        <span className="text-sm font-semibold text-ink-700">
                          {record.client}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-ink-500">
                        Issue:
                        <span className="ml-1 font-medium text-ink-700">
                          {record.issue || "—"}
                        </span>
                      </div>
                      <div>
                        {record.documents ? (
                          <Link
                            to="/appointments"
                            className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline"
                          >
                            <FileText size={15} /> View Documents
                          </Link>
                        ) : (
                          <span className="text-ink-200">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const modalField =
  "h-10 w-full rounded-xl border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400";

/** Creates a manual client record via POST /clients (no booking required). */
export function AddClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const age = String(form.get("age") ?? "");

    setSaving(true);
    setError(null);
    try {
      await api.post("/clients", {
        name: String(form.get("name")),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),
        address: String(form.get("address") ?? ""),
        jobTitle: String(form.get("jobTitle") ?? ""),
        age: age ? Number(age) : null,
        status: String(form.get("status") ?? "Stable"),
      });
      onCreated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save");
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
        aria-label="Add new client"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-pop max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <h2 className="text-[17px] font-semibold text-ink-900">Add New Client</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Manually add a client you consult off the booking site.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Full name <span className="text-rose-500">*</span>
            </span>
            <input name="name" required className={modalField} placeholder="Jane Smith" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Phone
              </span>
              <input name="phone" type="tel" className={modalField} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Age
              </span>
              <input name="age" type="number" min={0} max={120} className={modalField} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Email
            </span>
            <input name="email" type="email" className={modalField} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Address
            </span>
            <input name="address" className={modalField} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Job title
              </span>
              <input name="jobTitle" className={modalField} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Status
              </span>
              <select name="status" className={modalField} defaultValue="Stable">
                {Object.keys(CLIENT_STATUS_TONE).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          {error ? <p className="text-[12px] text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}