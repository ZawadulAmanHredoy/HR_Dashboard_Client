import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { usePageTitle } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { FALLBACK_PROFILE, useProfile } from "@/context/profile-context";

const DURATIONS = [15, 30, 45, 60, 90];

/**
 * Consultation settings. Duration and fees are the same columns the profile
 * form and the client-facing mentor page read, so editing them here changes
 * what clients are quoted — there is only one number, not a second copy.
 */
export default function OnlineConsultPage() {
  usePageTitle("Online Consult");

  const { profile, loading, refresh } = useProfile();
  const user = profile ?? FALLBACK_PROFILE;

  const [enabled, setEnabled] = useState(true);
  const [duration, setDuration] = useState(60);
  const [fees, setFees] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the profile (re)loads.
  useEffect(() => {
    if (!profile) return;
    setEnabled(profile.onlineConsultEnabled);
    setDuration(profile.appointmentDurationMinutes ?? 60);
    setFees(profile.pricePerSession === null ? "" : String(profile.pricePerSession));
  }, [profile]);

  const reset = () => {
    if (!profile) return;
    setEnabled(profile.onlineConsultEnabled);
    setDuration(profile.appointmentDurationMinutes ?? 60);
    setFees(profile.pricePerSession === null ? "" : String(profile.pricePerSession));
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.patch("/profile", {
        onlineConsultEnabled: enabled,
        appointmentDurationMinutes: duration,
        pricePerSession: fees === "" ? null : Number(fees),
      });
      refresh();
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-ink-100" />;
  }

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-semibold text-ink-900">Consultation Info</h2>

      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {/* Availability */}
          <fieldset>
            <legend className="mb-2.5 text-[12px] text-ink-500">Availability</legend>
            <div className="flex items-center gap-6">
              {[
                { label: "Disable", value: false },
                { label: "Enable", value: true },
              ].map((option) => (
                <label
                  key={option.label}
                  className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-900"
                >
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <input
                      type="radio"
                      name="availability"
                      checked={enabled === option.value}
                      onChange={() => {
                        setEnabled(option.value);
                        setSaved(false);
                      }}
                      className="peer h-4 w-4 appearance-none rounded-full border border-ink-200 checked:border-brand-500"
                    />
                    <span className="pointer-events-none absolute h-2 w-2 rounded-full bg-brand-500 opacity-0 peer-checked:opacity-100" />
                  </span>
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Duration */}
          <label className="block">
            <span className="mb-2.5 block text-[12px] text-ink-500">Duration</span>
            <select
              value={duration}
              onChange={(event) => {
                setDuration(Number(event.target.value));
                setSaved(false);
              }}
              className="h-11 w-full rounded-xl border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors focus:border-brand-400"
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} mins
                </option>
              ))}
            </select>
          </label>

          {/* Fees */}
          <label className="block">
            <span className="mb-2.5 block text-[12px] text-ink-500">Fees</span>
            <div className="flex h-11 items-center rounded-xl border border-ink-200 px-3 focus-within:border-brand-400">
              <span className="mr-2 text-[13px] text-ink-500">
                {user.currency === "BDT" ? "TK" : (user.currency ?? "TK")}
              </span>
              <input
                type="number"
                min={0}
                step={50}
                value={fees}
                onChange={(event) => {
                  setFees(event.target.value);
                  setSaved(false);
                }}
                placeholder="500"
                className="w-full bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-400"
              />
            </div>
          </label>
        </div>

        {!enabled ? (
          <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-3 text-[12px] text-amber-700">
            Online consultation is disabled. Your existing bookings are unaffected —
            this is what you offer going forward.
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-100 pt-5">
          {error ? <span className="mr-auto text-[12px] text-rose-600">{error}</span> : null}
          {saved ? (
            <span className="mr-auto text-[12px] text-emerald-600">
              Consultation info saved
            </span>
          ) : null}
          <Button type="button" variant="outline" className="min-w-[130px]" onClick={reset}>
            Cancel
          </Button>
          <Button type="submit" className="min-w-[130px]" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
