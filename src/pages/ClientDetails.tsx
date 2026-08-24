import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CalendarIcon,
  ChevronLeft,
  ClockIcon,
  DocIcon,
  FolderIcon,
  SparkIcon,
} from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { api, endpoints, type ClientDetail } from "@/lib/api";
import { CLIENT_STATUS_TONE, initials } from "@/pages/ClientRecords";
import { MONTHS_SHORT } from "@/lib/date";

const STATUSES = ["Stable", "Follow-up", "Closed"] as const;

/** "2026-04-20" -> "2026-04-20" is what the design shows, so keep it literal. */
function isoOrDash(value: string | null) {
  return value ?? "—";
}

function longDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return `${MONTHS_SHORT[month - 1]} ${String(day).padStart(2, "0")}, ${year}`;
}

export default function ClientDetailsPage() {
  usePageTitle("Client Details");

  const { key = "" } = useParams();
  const { data, loading, error, refresh } = useApi<ClientDetail>(
    endpoints.client(decodeURIComponent(key)),
  );

  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data) setNote(data.note ?? "");
  }, [data]);

  const saveNote = async () => {
    setSavingNote(true);
    setNoteSaved(false);
    try {
      await api.patch(endpoints.client(decodeURIComponent(key)), { note });
      setNoteSaved(true);
      refresh();
    } finally {
      setSavingNote(false);
    }
  };

  const saveDetails = async (form: FormData) => {
    await api.patch(endpoints.client(decodeURIComponent(key)), {
      name: String(form.get("name")),
      phone: String(form.get("phone")),
      email: String(form.get("email")),
      address: String(form.get("address")),
      jobTitle: String(form.get("jobTitle")),
      age: form.get("age") ? Number(form.get("age")) : null,
      status: String(form.get("status")),
    });
    setEditing(false);
    refresh();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-ink-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((tile) => (
            <div key={tile} className="h-20 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-ink-100 px-5 py-16 text-center">
        <p className="text-[13px] text-rose-600">{error ?? "Client not found"}</p>
        <Link
          to="/client-records"
          className="mt-3 inline-block text-[13px] font-medium text-brand-500 hover:text-brand-600"
        >
          Back to client records
        </Link>
      </div>
    );
  }

  const field =
    "h-10 w-full rounded-xl border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400";

  return (
    <div className="space-y-5">
      <Link
        to="/client-records"
        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-500 transition-colors hover:text-brand-600"
      >
        <ChevronLeft width={15} height={15} />
        All clients
      </Link>

      {/* Identity card */}
      <Card className="p-5">
        {editing ? (
          <form
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              void saveDetails(new FormData(event.currentTarget));
            }}
          >
            <Labelled label="Name">
              <input name="name" className={field} defaultValue={data.name} required />
            </Labelled>
            <Labelled label="Job title">
              <input name="jobTitle" className={field} defaultValue={data.jobTitle} />
            </Labelled>
            <Labelled label="Age">
              <input
                name="age"
                type="number"
                min={0}
                max={120}
                className={field}
                defaultValue={data.age ?? ""}
              />
            </Labelled>
            <Labelled label="Phone">
              <input name="phone" className={field} defaultValue={data.phone} />
            </Labelled>
            <Labelled label="Email">
              <input name="email" className={field} defaultValue={data.email} />
            </Labelled>
            <Labelled label="Address">
              <input name="address" className={field} defaultValue={data.address} />
            </Labelled>
            <Labelled label="Status">
              <select name="status" className={field} defaultValue={data.status}>
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Labelled>
            <div className="flex items-end justify-end gap-2 sm:col-span-2 xl:col-span-3">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit">Save details</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-[16px] font-semibold text-ink-500">
                {initials(data.name)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[19px] font-semibold text-ink-900">{data.name}</h2>
                  <Badge tone={CLIENT_STATUS_TONE[data.status] ?? "gray"}>
                    {data.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[12px] text-ink-400">
                  {[data.code, data.age ? `${data.age} years` : null]
                    .filter(Boolean)
                    .join(" • ") || "No record code yet"}
                </p>
              </div>
            </div>

            <Fact label="Phone" value={data.phone} />
            <Fact label="Email" value={data.email} />
            <Fact label="Address" value={data.address} />

            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setEditing(true)}
            >
              Edit details
            </Button>
          </div>
        )}
      </Card>

      {/* Booking facts — derived, never editable here */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={FolderIcon} label="Job Title" value={data.jobTitle || "—"} />
        <Tile icon={SparkIcon} label="Issue" value={data.issue || "—"} />
        <Tile icon={CalendarIcon} label="Last Consult" value={isoOrDash(data.lastConsult)} />
        <Tile
          icon={ClockIcon}
          label="Next Appointment"
          value={isoOrDash(data.nextAppointment)}
        />
      </div>

      {/* Resume */}
      <section>
        <h3 className="mb-3 text-[14px] font-semibold text-ink-900">Resume</h3>
        {data.resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 px-5 py-10 text-center">
            <p className="text-[12.5px] text-ink-500">
              No CV attached to this client&apos;s bookings yet.
            </p>
            <p className="mt-1 text-[11.5px] text-ink-400">
              Clients can attach a CV from their history when they book.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {data.resumes.map((resume) => (
              <div
                key={resume.id}
                className="w-[180px] overflow-hidden rounded-xl border border-ink-200 bg-white"
              >
                <div className="flex h-[190px] items-center justify-center bg-ink-100/60">
                  <DocIcon width={34} height={34} className="text-ink-400" />
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-[12px] font-medium text-ink-900">
                    {resume.title}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    {resume.updatedAt ? longDate(resume.updatedAt.slice(0, 10)) : "Attached"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Note */}
      <section>
        <h3 className="mb-3 text-[14px] font-semibold text-ink-900">Note</h3>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setNoteSaved(false);
          }}
          rows={5}
          placeholder="Write to client..."
          className="w-full rounded-2xl border border-ink-200 p-4 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        />
        <div className="mt-3 flex items-center justify-end gap-3">
          {noteSaved ? (
            <span className="text-[12px] text-emerald-600">Note saved</span>
          ) : null}
          <Button onClick={saveNote} disabled={savingNote}>
            {savingNote ? "Saving..." : "Save note"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[150px]">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="mt-0.5 text-[13px] text-ink-900">{value || "—"}</p>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: (props: { width?: number; height?: number; className?: string }) => React.ReactElement;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
        <Icon width={17} height={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-400">{label}</p>
        <p className="truncate text-[13.5px] font-medium text-ink-900">{value}</p>
      </div>
    </Card>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}
