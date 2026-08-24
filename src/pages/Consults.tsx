import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClockIcon } from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { endpoints, type Appointment, type ConsultStat } from "@/lib/api";
import { MONTHS_SHORT } from "@/lib/date";

export default function ConsultsPage() {
  usePageTitle("My Consults");

  const stats = useApi<ConsultStat[]>(endpoints.stats);
  const appointments = useApi<Appointment[]>(endpoints.appointments({}));

  const history = (appointments.data ?? []).filter((a) => a.status !== "cancelled");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading
          ? [0, 1, 2, 3].map((tile) => (
              <Card key={tile} className="p-5">
                <div className="h-16 animate-pulse rounded-lg bg-ink-100" />
              </Card>
            ))
          : (stats.data ?? []).map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-[12px] text-ink-500">{stat.label}</p>
                <p className="mt-2 text-[26px] font-semibold leading-none text-ink-900">
                  {stat.value}
                </p>
                <p className="mt-2 text-[11px] text-brand-500">{stat.delta}</p>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader
          title="Consult history"
          subtitle="Every session booked through your profile"
        />
        {appointments.loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : appointments.error ? (
          <p className="px-5 py-14 text-center text-[13px] text-rose-600">
            {appointments.error}
          </p>
        ) : (
          <ul>
            {history.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-3.5 last:border-b-0"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <ClockIcon width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink-900">{row.client}</p>
                  <p className="text-[11.5px] text-ink-500">
                    {MONTHS_SHORT[row.month]} {String(row.day).padStart(2, "0")},{" "}
                    {row.year} &middot; {row.start} - {row.end} &middot; {row.mode}
                  </p>
                </div>
                <Badge tone={row.status === "upcoming" ? "brand" : "gray"}>
                  {row.status === "upcoming" ? "Scheduled" : "Completed"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
