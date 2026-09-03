import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, type MentorApplication, type MentorApplicationStatus, type Profile } from "@/lib/api";
import { avatarSrc } from "@/lib/avatar";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDown } from "@/components/icons";

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

function Field({ label, value }: { label: string; value?: ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900">{value}</dd>
    </div>
  );
}

function ProfileDetail({ detail }: { detail: Profile }) {
  const education = detail.education ?? [];
  const awards = detail.awards ?? [];
  const certifications = detail.certifications ?? [];
  const experience = detail.experience ?? [];

  return (
    <div className="space-y-6 border-t border-ink-100 pt-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Email" value={detail.email} />
        <Field label="Phone" value={detail.phone} />
        <Field label="Role" value={detail.role} />
        <Field label="Department" value={detail.department} />
        <Field label="Designation" value={detail.designation} />
        <Field
          label="Experience"
          value={detail.yearsExperience ? `${detail.yearsExperience} years` : undefined}
        />
        <Field
          label="Session fee"
          value={
            detail.pricePerSession
              ? `${detail.currency ?? "BDT"} ${detail.pricePerSession}`
              : undefined
          }
        />
        <Field label="Gender" value={detail.gender} />
        <Field label="Date of birth" value={formatDate(detail.dateOfBirth || null)} />
        <Field label="Blood group" value={detail.bloodGroup} />
        <Field label="Languages" value={detail.languages?.join(", ")} />
        <Field label="Timezone" value={detail.timezone} />
      </div>

      {detail.bio && (
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">
            About
          </h4>
          <p className="text-sm leading-relaxed text-ink-700">{detail.bio}</p>
        </div>
      )}

      {detail.skills && detail.skills.length > 0 && (
        <div>
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
            Skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {detail.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {education.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              Education
            </h4>
            <ul className="space-y-3">
              {education.map((ed, i) => (
                <li key={i} className="rounded-xl border border-ink-100 p-3">
                  <p className="text-sm font-semibold text-ink-900">{ed.degree}</p>
                  <p className="text-xs text-ink-500">{ed.university}</p>
                  {ed.from && (
                    <p className="mt-1 text-xs text-ink-400">
                      {ed.from}
                      {ed.to ? ` – ${ed.to}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              Experience
            </h4>
            <ul className="space-y-3">
              {experience.map((exp, i) => (
                <li key={i} className="rounded-xl border border-ink-100 p-3">
                  <p className="text-sm font-semibold text-ink-900">{exp.position}</p>
                  <p className="text-xs text-ink-500">{exp.company}</p>
                  {exp.from && (
                    <p className="mt-1 text-xs text-ink-400">
                      {exp.from}
                      {exp.to ? ` – ${exp.to}` : ""}
                    </p>
                  )}
                  {exp.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                      {exp.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(certifications.length > 0 || awards.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {certifications.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Certifications
              </h4>
              <ul className="space-y-1.5">
                {certifications.map((cert, i) => (
                  <li key={i} className="text-sm text-ink-700">
                    {cert.name}
                    {cert.date ? ` · ${cert.date}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {awards.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Awards
              </h4>
              <ul className="space-y-1.5">
                {awards.map((award, i) => (
                  <li key={i} className="text-sm text-ink-700">
                    {award.name}
                    {award.date ? ` · ${award.date}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {detail.addressLine1 && (
        <div>
          <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">
            Address
          </h4>
          <p className="text-sm text-ink-700">
            {[detail.addressLine1, detail.addressLine2, detail.city, detail.state, detail.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<MentorApplicationStatus | "all">("pending");
  const [rows, setRows] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailByRow, setDetailByRow] = useState<Record<string, Profile>>({});
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

  const toggleExpand = async (rowId: string) => {
    if (expandedId === rowId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(rowId);
    if (!detailByRow[rowId]) {
      try {
        const detail = await api.get<Profile>(`/admin/applications/${encodeURIComponent(rowId)}`);
        setDetailByRow((prev) => ({ ...prev, [rowId]: detail }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load details.");
      }
    }
  };

  const decide = async (row: MentorApplication, approve: boolean) => {
    let note: string | null = null;
    if (!approve) {
      note = window.prompt(
        `Why is ${row.name}'s application not approved?\nThis is included in the email to them (optional).`,
        "",
      );
      if (note === null) return;
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
          Consultants who asked to appear on the website. Click one to review their
          full profile. Approving publishes the profile and emails them; rejecting
          leaves it hidden.
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
          {rows.map((row) => {
            const expanded = expandedId === row.id;
            const detail = detailByRow[row.id];
            return (
              <li
                key={row.id}
                className="rounded-2xl border border-ink-100 bg-white"
              >
                <div className="flex w-full flex-wrap items-center gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => void toggleExpand(row.id)}
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-4 text-left"
                  >
                    <Avatar
                      src={avatarSrc(row.avatarUrl)}
                      name={row.name}
                      className="h-12 w-12 shrink-0 text-sm"
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
                          {row.reviewedBy && (
                            <div className="text-ink-400">by {row.reviewedBy}</div>
                          )}
                          {row.note && <div className="mt-1 text-ink-400">“{row.note}”</div>}
                        </>
                      )}
                    </div>

                    <ChevronDown
                      width={18}
                      height={18}
                      className={`text-ink-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
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
                </div>

                {expanded && (
                  <div className="px-4 pb-5">
                    {detail ? (
                      <ProfileDetail detail={detail} />
                    ) : (
                      <p className="border-t border-ink-100 pt-5 text-sm text-ink-400">
                        Loading profile…
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
