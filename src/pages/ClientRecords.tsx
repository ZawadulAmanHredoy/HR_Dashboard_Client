import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchIcon } from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { endpoints, type Appointment } from "@/lib/api";
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

  const { data, loading, error } = useApi<Appointment[]>(endpoints.appointments({}));

  const records = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? [])
      .filter((row) => matchesTab(row.date, tab))
      .filter(
        (row) =>
          !q ||
          row.client.toLowerCase().includes(q) ||
          row.issue.toLowerCase().includes(q),
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }, [data, tab, search]);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-ink-500">
          Manage and view all client records
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-ink-900">Client Records</h1>
          <label className="relative sm:w-72">
            <SearchIcon
              width={16}
              height={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or issue"
              className="h-10 w-full rounded-xl border border-ink-200 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
            />
          </label>
        </div>
      </header>

      {/* Tabs filter */}
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

      {/* Records list */}
      <div className="scroll-slim max-h-[600px] space-y-4 overflow-y-auto pr-2">
        {loading ? (
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
        ) : error ? (
          <p className="rounded-2xl border border-ink-100 bg-white px-5 py-14 text-center text-[13px] text-rose-600">
            {error}
          </p>
        ) : records.length === 0 ? (
          <p className="rounded-2xl border border-ink-100 bg-white px-5 py-14 text-center text-[13px] text-ink-500">
            {search
              ? `No appointments match "${search}".`
              : tab === "All"
                ? "No appointments yet — they appear here once somebody books you."
                : `No ${tab.toLowerCase()} appointments.`}
          </p>
        ) : (
          records.map((record) => {
            const { weekday, day } = dayParts(record.date);
            const cancelled = record.status === "cancelled";
            return (
              <div
                key={record.id}
                className={cn(
                  "group flex items-center rounded-2xl border bg-white p-4 transition-shadow duration-300 hover:shadow-card",
                  cancelled ? "border-ink-100 opacity-60" : "border-ink-100",
                )}
              >
                {/* Date box */}
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-canvas">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    {weekday}
                  </span>
                  <span className="text-2xl font-bold text-ink-900">{day}</span>
                </div>

                {/* Divider */}
                <div className="mx-6 h-12 w-px bg-ink-100" />

                {/* Content grid */}
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