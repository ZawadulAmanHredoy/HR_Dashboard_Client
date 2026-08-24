import { useApi } from "@/hooks/useApi";
import { endpoints, type ConsultSession } from "@/lib/api";

export function UpcomingPanel() {
  const { data, loading, error } = useApi<ConsultSession[]>(
    endpoints.upcomingSessions,
  );

  const groups = (data ?? []).reduce<Record<string, ConsultSession[]>>(
    (acc, session) => {
      (acc[session.group] ??= []).push(session);
      return acc;
    },
    {},
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink-100">
      <h2 className="border-b border-ink-100 px-4 py-3.5 text-[14px] font-semibold text-ink-900">
        Upcoming
      </h2>

      <div className="scroll-slim max-h-[560px] flex-1 space-y-4 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : error ? (
          <p className="py-10 text-center text-[12px] text-rose-600">{error}</p>
        ) : (
          Object.entries(groups).map(([group, sessions]) => (
            <section key={group}>
              <h3 className="mb-2 text-[12px] font-medium text-ink-400">{group}</h3>
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-ink-100/60 px-3 py-2.5 transition-colors hover:bg-brand-50"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-brand-500">
                        {session.label}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-700">
                        {session.start} - {session.end}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-ink-400">
                      {session.dateLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
