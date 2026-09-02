import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  Briefcase,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, DocIcon } from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { api, endpoints, type ClientDetail } from "@/lib/api";
import { CLIENT_STATUS_TONE, initials } from "@/pages/ClientRecords";
import { MONTHS_SHORT } from "@/lib/date";

const STATUSES = ["Stable", "Follow-up", "Closed"] as const;

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
  const [previews, setPreviews] = useState<
    Record<string, { url: string; error: boolean }>
  >({});

  useEffect(() => {
    if (data) setNote(data.note ?? "");
  }, [data]);

  // Load each uploaded resume's bytes so its PDF can be previewed inline.
  // Revoked on unmount to avoid leaking object URLs.
  useEffect(() => {
    const uploaded = (data?.resumes ?? []).filter((resume) => resume.storagePath);
    if (!uploaded.length) return;

    let alive = true;
    const created: string[] = [];
    uploaded.forEach((resume) => {
      api
        .getBlob(endpoints.resumeBytes(key, resume.storagePath as string))
        .then((blob) => {
          if (!alive) return;
          const url = URL.createObjectURL(blob);
          created.push(url);
          setPreviews((prev) => ({ ...prev, [resume.id]: { url, error: false } }));
        })
        .catch(() => {
          if (!alive) return;
          setPreviews((prev) => ({ ...prev, [resume.id]: { url: "", error: true } }));
        });
    });

    return () => {
      alive = false;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data, key]);

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

  /** Opens a booking-time upload through a short-lived signed URL. */
  const openResume = async (resume: ClientDetail["resumes"][number]) => {
    if (!resume.storagePath) return;
    const { url } = await api.get<{ url: string }>(
      endpoints.resumeUrl(decodeURIComponent(key), resume.storagePath),
    );
    window.open(url, "_blank", "noopener");
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <div className="space-y-6 pb-12">
      {/* Back link */}
      <Link
        to="/client-records"
        className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-500 transition-colors hover:text-brand-600"
      >
        <ChevronLeft width={15} height={15} />
        All clients
      </Link>

      {/* Client profile banner */}
      <div className="flex flex-col gap-8 rounded-[2rem] border border-ink-100 bg-white p-8 shadow-sm md:flex-row md:items-start md:justify-between md:gap-12">
        {editing ? (
          <form
            className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
          <>
            <div className="flex items-center gap-6">
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 shrink-0 rounded-full border border-ink-100 object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-ink-100 bg-ink-50 text-2xl font-bold text-ink-400">
                  {initials(data.name)}
                </span>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-ink-900">{data.name}</h2>
                  <Badge
                    tone={CLIENT_STATUS_TONE[data.status] ?? "gray"}
                    className="px-3 py-0.5 uppercase tracking-wide"
                  >
                    {data.status}
                  </Badge>
                </div>
                <p className="mt-1 font-medium text-ink-400">
                  {[data.code, data.age != null ? `${data.age} years` : null]
                    .filter(Boolean)
                    .join(" • ") || "No record code yet"}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap gap-x-12 gap-y-6">
              <ContactItem icon={Phone} label="Phone" value={data.phone} />
              <ContactItem icon={Mail} label="Email" value={data.email} />
              <ContactItem icon={MapPin} label="Address" value={data.address} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start"
              onClick={() => setEditing(true)}
            >
              Edit details
            </Button>
          </>
        )}
      </div>

      {/* Booking facts */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={Briefcase}
          label="Job Title"
          value={data.jobTitle || "—"}
          tone="bg-brand-50 text-brand-500"
        />
        <InfoCard
          icon={Activity}
          label="Issue"
          value={data.issue || "—"}
          tone="bg-amber-50 text-amber-500"
        />
        <InfoCard
          icon={Calendar}
          label="Last Consult"
          value={isoOrDash(data.lastConsult)}
          tone="bg-brand-50 text-brand-500"
        />
        <InfoCard
          icon={Clock}
          label="Next Appointment"
          value={isoOrDash(data.nextAppointment)}
          tone="bg-brand-50 text-brand-500"
        />
      </div>

      {/* Booking note — what the client wrote when they booked */}
      {data.bookingNote ? (
        <section>
          <h3 className="mb-4 text-xl font-bold text-ink-900">Booking note</h3>
          <div className="whitespace-pre-wrap rounded-2xl border border-ink-200 bg-ink-50/50 p-4 text-[13px] text-ink-900">
            {data.bookingNote}
          </div>
        </section>
      ) : null}

      {/* Resume */}
      <section>
        <h3 className="mb-4 text-xl font-bold text-ink-900">Resume</h3>
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
            {data.resumes.map((resume) => {
              const preview = previews[resume.id];
              const openPreview = resume.storagePath
                ? () => {
                    const target = preview?.url;
                    if (target) {
                      window.open(target, "_blank", "noopener");
                    } else {
                      void openResume(resume);
                    }
                  }
                : () => void openResume(resume);

              return (
                <div
                  key={resume.id}
                  className="w-[180px] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {preview?.url ? (
                    <button
                      type="button"
                      onClick={openPreview}
                      className="block h-[210px] w-full overflow-hidden"
                      title="Open CV"
                    >
                      <iframe
                        src={preview.url}
                        title={resume.title}
                        className="pointer-events-none h-[210px] w-[180px] border-0"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openPreview}
                      className="flex h-[210px] w-full items-center justify-center bg-ink-100/60"
                    >
                      <DocIcon width={34} height={34} className="text-ink-400" />
                    </button>
                  )}
                  <div className="px-3 py-2.5">
                    <p className="truncate text-[12px] font-medium text-ink-900">
                      {resume.title}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {resume.updatedAt ? longDate(resume.updatedAt.slice(0, 10)) : "Attached"}
                    </p>
                    {resume.storagePath ? (
                      <button
                        type="button"
                        onClick={openPreview}
                        className="mt-1.5 text-[11px] font-medium text-brand-500 transition-colors hover:text-brand-600"
                      >
                        Open file
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Note */}
      <section>
        <h3 className="mb-4 text-xl font-bold text-ink-900">Note</h3>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setNoteSaved(false);
          }}
          rows={5}
          placeholder="Write to client..."
          className="w-full resize-none rounded-3xl border border-ink-200 bg-white p-8 text-[13px] text-ink-900 shadow-sm outline-none transition-all placeholder:text-ink-300 focus:ring-4 focus:ring-brand-50"
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

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-indigo-500">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          {label}
        </p>
        <p className="mt-1 whitespace-nowrap text-sm font-bold text-ink-700">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-5 rounded-[1.5rem] border border-ink-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className={`shrink-0 rounded-2xl p-3.5 ${tone}`}>
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-400">{label}</p>
        <p className="truncate text-lg font-bold leading-tight text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}