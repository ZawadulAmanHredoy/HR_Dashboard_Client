import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

const field =
  "h-10 w-full rounded-xl border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400";

export function NewAppointmentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await api.post("/appointments", {
        date: String(form.get("date")),
        startTime: `${startTime}:00`,
        endTime: `${addMinutes(startTime, 30)}:00`,
        client: String(form.get("client")),
        issue: String(form.get("issue")),
        mode: "Online",
        note: String(form.get("note") ?? ""),
      });
      onCreated?.();
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
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-pop"
      >
        <h2 className="text-[17px] font-semibold text-ink-900">New Appointment</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Book a slot with one of your clients.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Client
            </span>
            <input
              name="client"
              required
              className={field}
              placeholder="Search client name"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-700">
                Date
              </span>
              <input
                name="date"
                className={field}
                type="date"
                defaultValue="2026-05-20"
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
                defaultValue="09:00"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Issue
            </span>
            <select name="issue" className={field} defaultValue="Career">
              <option>Career</option>
              <option>Job</option>
              <option>CV Review</option>
              <option>Interview</option>
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
            />
          </label>

          {error ? <p className="text-[12px] text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create appointment"}
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
