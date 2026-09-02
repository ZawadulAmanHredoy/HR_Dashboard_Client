import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, User } from "lucide-react";
import { SearchIcon } from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { endpoints, type ClientRecord } from "@/lib/api";
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

function consultDay(iso: string | null | undefined) {
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** `lastConsult` is "YYYY-MM-DD", so the relative-tab filters are plain string compares. */
function matchesTab(iso: string | null | undefined, tab: Tab) {
  const key = iso ? iso.slice(0, 10) : null;
  if (!key) return tab === "All";
  switch (tab) {
    case "Today":
      return key === TODAY_KEY;
    case "Yesterday":
      return key === YESTERDAY_KEY;
    case "Past":
      return key < YESTERDAY_KEY;
    default:
      return true;
  }
}

export default function ClientRecordsPage() {
  usePageTitle("Client Records");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("All");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error } = useApi<ClientRecord[]>(endpoints.clients(query));
  const clients = useMemo(
    () => (data ?? []).filter((client) => matchesTab(client.lastConsult, tab)),
    [data, tab],
  );

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
              placeholder="Search clients"
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
        ) : clients.length === 0 ? (
          <p className="rounded-2xl border border-ink-100 bg-white px-5 py-14 text-center text-[13px] text-ink-500">
            {query
              ? `No clients match "${query}".`
              : tab === "All"
                ? "No clients yet — they appear here once somebody books you."
                : `No ${tab.toLowerCase()} clients.`}
          </p>
        ) : (
          clients.map((client) => {
            const consult = consultDay(client.lastConsult);
            return (
              <div
                key={client.id}
                className="group flex items-center rounded-2xl border border-ink-100 bg-white p-4 transition-shadow duration-300 hover:shadow-card"
              >
                {/* Date box */}
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-canvas">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    {consult
                      ? consult.toLocaleDateString("en-US", { weekday: "short" })
                      : "—"}
                  </span>
                  <span className="text-2xl font-bold text-ink-900">
                    {consult ? consult.getDate() : "–"}
                  </span>
                </div>

                {/* Divider */}
                <div className="mx-6 h-12 w-px bg-ink-100" />

                {/* Content grid */}
                <div className="grid flex-1 grid-cols-1 gap-y-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-ink-500">
                      <Clock size={18} className="text-ink-400" />
                      <span className="text-sm font-medium">
                        {client.lastSeen || "No consult yet"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-ink-500">
                      <User size={18} className="text-ink-400" />
                      <Link
                        to={`/client-records/${encodeURIComponent(client.id)}`}
                        className="text-sm font-semibold text-ink-700 transition-colors hover:text-brand-500"
                      >
                        {client.name}
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-ink-500">
                      Issue:
                      <span className="ml-1 font-medium text-ink-700">
                        {client.issue || "—"}
                      </span>
                    </div>
                    <div>
                      {client.attachments.length > 0 ? (
                        <Link
                          to={`/client-records/${encodeURIComponent(client.id)}`}
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