import { useCallback, useEffect, useState } from "react";
import { api, type MentorApplication, type MentorApplicationStatus } from "@/lib/api";
import { avatarSrc } from "@/lib/avatar";
import { Avatar } from "@/components/ui/Avatar";

const TABS: { key: MentorApplicationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminPage() {
  const [tab, setTab] = useState<MentorApplicationStatus | "all">("pending");
  const [rows, setRows] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Id of the row currently being approved/rejected, so only its buttons lock.
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get<MentorApplication[]>(
        `/admin/applications?status=${tab}`,
      );
      setRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (row: MentorApplication, approve: boolean) => {
    // Rejections carry a reason so the applicant's email explains itself.
    let note: string | null = null;
    if (!approve) {
      note = window.prompt(
        `Why is ${row.name}'s application not approved?\nThis is included in the email to them (optional).`,
        "",
      );
      if (note === null) return; // cancelled
    }

    setBusy(row.id);
    setError(null);
    try {
      await api.post(
        `/admin/applications/${encodeURIComponent(row.id)}/${approve ? "approve" : "reject"}`,
        approve ? {} : { note },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that decision.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-ink-900">Mentor applications</h1>
        <p className="mt-1 text-sm text-ink-500">
          Consultants who asked to appear on the website. Approving publishes the
          profile and emails them; rejecting leaves it hidden.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={
              entry.key === tab
                ? "rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white"
                : "rounded-full bg-ink-100 px-4 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-200"
            }
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-400">Loading applications…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-ink-100 bg-white px-4 py-10 text-center text-sm text-ink-400">
          Nothing here right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4"
            >
              <Avatar
                src={avatarSrc(row.avatarUrl)}
                name={row.name}
                className="h-12 w-12 text-sm"
              />

              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-ink-900">{row.name || "Unnamed"}</p>
                <p className="text-sm text-ink-500">{row.email}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {[
                    row.designation || row.role,
                    row.yearsExperience ? `${row.yearsExperience} yrs` : "",
                    row.pricePerSession ? `${row.currency} ${row.pricePerSession}` : "",
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                </p>
              </div>

              <div className="min-w-[150px] text-xs text-ink-500">
                {row.status === "pending" && row.submittedAt && (
                  <>Submitted {formatDate(row.submittedAt)}</>
                )}
                {row.status !== "pending" && row.reviewedAt && (
                  <>
                    {row.status === "approved" ? "Approved" : "Rejected"}{" "}
                    {formatDate(row.reviewedAt)}
                    {row.reviewedBy && <div className="text-ink-400">by {row.reviewedBy}</div>}
                    {row.note && <div className="mt-1 text-ink-400">“{row.note}”</div>}
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {row.status !== "approved" && (
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => void decide(row, true)}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === row.id ? "Saving…" : "Approve"}
                  </button>
                )}
                {row.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => void decide(row, false)}
                    className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                  >
                    {row.status === "approved" ? "Unpublish" : "Reject"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
