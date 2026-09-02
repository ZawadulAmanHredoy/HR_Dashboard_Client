import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { api, endpoints, type Appointment, type ClientRecord } from "@/lib/api";

const field =
  "h-10 w-full rounded-xl border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400";

/** "04:00pm" (display format) -> "16:00" for <input type="time">. */
function toTimeInput(display: string) {
  const match = display.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) return display;
  let hour = Number(match[1]) % 12;
  if (match[3].toLowerCase() === "pm") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

/** Today as a local "YYYY-MM-DD" string for <input type="date">. */
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function NewAppointmentModal({
  open,
  onClose,
  onCreated,
  appointment,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (saved: Appointment) => void;
  /** When set the modal edits/reschedules this appointment instead of creating one. */
  appointment?: Appointment | null;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client search: typing queries the consultant's client list; picking a
  // suggestion fills the field. Free text is still allowed for ad-hoc clients.
  const [clientQuery, setClientQuery] = useState("");
  const [matches, setMatches] = useState<ClientRecord[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fresh state every time the dialog opens (create vs edit target).
  useEffect(() => {
    if (!open) return;
    setClientQuery(appointment?.client ?? "");
    setMatches([]);
    setListOpen(false);
  }, [open, appointment]);

  // Debounced search against GET /clients?search=…
  useEffect(() => {
    if (!open || !listOpen) return;
    const term = clientQuery.trim();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setMatches(
          await api.get<ClientRecord[]>(endpoints.clients(term || undefined)),
        );
      } catch {
        setMatches([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [clientQuery, listOpen, open]);

  // Close the suggestions when clicking anywhere else.
  useEffect(() => {
    if (!listOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setListOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [listOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startTime = String(form.get("startTime"));

    setSaving(true);
    setError(null);
    try {
      const payload = {
        date: String(form.get("date")),
        startTime: `${startTime}:00`,
        endTime: `${addMinutes(startTime, 30)}:00`,
        client: String(form.get("client")),
        issue: String(form.get("issue")),
        mode: String(form.get("mode") ?? "Online"),
        note: String(form.get("note") ?? ""),
      };
      const saved = appointment
        ? await api.patch<Appointment>(`/appointments/${appointment.id}`, payload)
        : await api.post<Appointment>("/appointments", payload);
      onCreated?.(saved);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save",
      );
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
        aria-label="New appointment"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-pop max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <h2 className="text-[17px] font-semibold text-ink-900">
          {appointment ? "Edit Appointment" : "New Appointment"}
        </h2>
        <p className="mt-1 text-[13px] text-ink-500">
          {appointment
            ? "Update the details — the client is notified of time changes."
            : "Book a slot with one of your clients."}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="relative" ref={pickerRef}>
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Client
            </span>
            <input
              name="client"
              required
              value={clientQuery}
              className={field}
              placeholder="Search client name"
              autoComplete="off"
              onChange={(event) => {
                setClientQuery(event.target.value);
                setListOpen(true);
              }}
              onFocus={() => setListOpen(true)}
            />
            {listOpen ? (
              <div
                role="listbox"
                className="absolute z-10 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-ink-100 bg-white py-1 shadow-pop"
              >
                {searching ? (
                  <p className="px-3.5 py-2 text-[12px] text-ink-400">
                    Searching…
                  </p>
                ) : matches.length === 0 ? (
                  <p className="px-3.5 py-2 text-[12px] text-ink-400">
                    No clients found — the name will be used as typed.
                  </p>
                ) : (
                  matches.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      role="option"
                      onClick={() => {
                        setClientQuery(client.name);
                        setListOpen(false);
                      }}
                      className="block w-full px-3.5 py-2 text-left transition-colors hover:bg-ink-100"
                    >
                      <span className="text-[13px] font-medium text-ink-900">
                        {client.name}
                      </span>
                      {client.email ? (
                        <span className="ml-1.5 text-[11px] text-brand-500">
                          {client.email}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Date
              </span>
              <input
                name="date"
                className={field}
                type="date"
                defaultValue={appointment?.date ?? todayIso()}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Start time
              </span>
              <input
                name="startTime"
                className={field}
                type="time"
                defaultValue={
                  appointment ? toTimeInput(appointment.start) : "09:00"
                }
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Issue
            </span>
            <select
              name="issue"
              className={field}
              defaultValue={appointment?.issue ?? "Career"}
            >
              <option>Career</option>
              <option>Job</option>
              <option>CV Review</option>
              <option>Interview</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Mode
            </span>
            <select
              name="mode"
              className={field}
              defaultValue={appointment?.mode ?? "Online"}
            >
              <option>Online</option>
              <option>In person</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Note
            </span>
            <textarea
              name="note"
              rows={3}
              className="w-full rounded-xl border border-ink-200 p-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
              placeholder="Anything the client should prepare?"
              defaultValue={appointment?.note ?? ""}
            />
          </label>

          {error ? <p className="text-[12px] text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : appointment ? "Save changes" : "Create appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}
