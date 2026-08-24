import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { SearchIcon } from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { endpoints, type ClientRecord } from "@/lib/api";

export const CLIENT_STATUS_TONE = {
  Stable: "green",
  "Follow-up": "amber",
  Closed: "gray",
} as const;

export default function ClientRecordsPage() {
  usePageTitle("Client Records");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error } = useApi<ClientRecord[]>(endpoints.clients(query));
  const clients = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative flex-1 sm:max-w-xs">
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
        <p className="text-[12px] text-ink-400">
          {clients.length} client{clients.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-100">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Issue</th>
              <th className="px-5 py-3 font-medium">Sessions</th>
              <th className="px-5 py-3 font-medium">Last consult</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2, 3].map((row) => (
                <tr key={row} className="border-b border-ink-100 last:border-b-0">
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-8 animate-pulse rounded-lg bg-ink-100" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-[13px] text-rose-600">
                  {error}
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-[13px] text-ink-500">
                  {query
                    ? `No clients match “${query}”.`
                    : "No clients yet — they appear here once somebody books you."}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-ink-100 transition-colors last:border-b-0 hover:bg-ink-100/50"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/client-records/${encodeURIComponent(client.id)}`}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-600">
                        {initials(client.name)}
                      </span>
                      <div>
                        <p className="text-[13px] font-medium text-ink-900">
                          {client.name}
                        </p>
                        <p className="text-[11px] text-ink-400">
                          {client.code ? `${client.code} · ` : ""}
                          {client.email || "No account"}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-ink-700">
                    {client.issue || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-ink-700">
                    {client.sessions}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-ink-500">
                    {client.lastSeen || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={CLIENT_STATUS_TONE[client.status] ?? "gray"}>
                      {client.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
