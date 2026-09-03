import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { PlusIcon } from "@/components/icons";
import { useApi, usePageTitle } from "@/hooks/useApi";
import { API_BASE_URL, api, endpoints, type AvailabilityMonth, type Profile } from "@/lib/api";
import { FALLBACK_PROFILE, useProfile } from "@/context/profile-context";
import { cn } from "@/lib/cn";

const field =
  "h-10 w-full rounded-xl border border-ink-200 px-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400";

const DEPARTMENTS = ["Career Services", "Recruitment", "Marketing", "Operations"];
const DESIGNATIONS = ["Consultant", "Senior Consultant", "Manager", "Marketing"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Female", "Male", "Prefer not to say"];
const APPOINTMENT_TYPES = ["Online Consultation", "In person", "Both"];

type EducationRow = Profile["education"][number];
type DatedRow = { name: string; date: string };

/* -------------------------------------------- weekly appointment schedule */

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
type Weekday = (typeof WEEKDAYS)[number];
type SlotRow = { start: string; end: string };

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "09:00am" / "04:30pm" (as the availability API formats it) -> "09:00". */
function to24(t12: string) {
  const match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(t12.trim());
  if (!match) return "";
  let hour = Number(match[1]) % 12;
  if (/pm/i.test(match[3])) hour += 12;
  return `${pad2(hour)}:${match[2]}`;
}

/** Row duration in minutes, clamped to what the slots API accepts, or null. */
function durationOf(row: SlotRow) {
  const [sh, sm] = row.start.split(":").map(Number);
  const [eh, em] = row.end.split(":").map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(eh)) return null;
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes >= 15 && minutes <= 240 ? minutes : null;
}

/** Next calendar date (YYYY-MM-DD) whose weekday matches, including today. */
function nextWeekdayISO(day: Weekday, now = new Date()) {
  const target = WEEKDAYS.indexOf(day);
  const today = (now.getDay() + 6) % 7; // Monday = 0
  const ahead = (target - today + 7) % 7;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function blankDay(): SlotRow[] {
  return [{ start: "", end: "" }];
}

function blankWeek(): Record<Weekday, SlotRow[]> {
  return Object.fromEntries(WEEKDAYS.map((day) => [day, blankDay()])) as Record<
    Weekday,
    SlotRow[]
  >;
}

/** Defaults: no day starts out as a day off. */
function blankOff(): Record<Weekday, boolean> {
  return Object.fromEntries(WEEKDAYS.map((day) => [day, false])) as Record<Weekday, boolean>;
}

/** Deletes the recurring slots we published for a weekday over the next 8 weeks. */
async function clearPublishedSlots(day: Weekday) {
  const base = new Date(`${nextWeekdayISO(day)}T00:00:00Z`);
  const monthCache = new Map<string, AvailabilityMonth>();
  for (let week = 0; week < 8; week += 1) {
    const date = new Date(base.getTime() + week * 7 * 86400000);
    const iso = date.toISOString().slice(0, 10);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const cacheKey = `${year}-${month}`;
    let monthData = monthCache.get(cacheKey);
    if (!monthData) {
      monthData = await api.get<AvailabilityMonth>(endpoints.availability(year, month));
      monthCache.set(cacheKey, monthData);
    }
    const entry = monthData.days.find((row) => row.date === iso);
    for (const slot of entry?.slots ?? []) {
      try {
        await api.delete(`/availability/slots/${slot.id}`);
      } catch {
        // A slot with an active booking can't be removed — leave it.
      }
    }
  }
}

export default function ProfilePage() {
  usePageTitle("Profile");

  const { profile, loading, refresh } = useProfile();
  const user = profile ?? FALLBACK_PROFILE;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile picture upload state.
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  useEffect(() => {
    if (profile) setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  const uploadAvatar = async (file: File) => {
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      // api() speaks JSON, so the multipart call goes through fetch directly.
      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Upload failed");
      }
      setAvatarUrl((payload as { data: { url: string } }).data.url);
    } catch (uploadError_) {
      setAvatarError(
        uploadError_ instanceof Error ? uploadError_.message : "Upload failed",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Repeating sections are React state; the flat fields ride on the form itself.
  const [languages, setLanguages] = useState<string[]>([]);
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [awards, setAwards] = useState<DatedRow[]>([]);
  const [certifications, setCertifications] = useState<DatedRow[]>([]);
  const [experience, setExperience] = useState<Profile["experience"]>([]);

  useEffect(() => {
    if (!profile) return;
    setLanguages(profile.languages ?? []);
    setEducation(profile.education ?? []);
    setAwards(profile.awards ?? []);
    setCertifications(profile.certifications ?? []);
    setExperience(profile.experience ?? []);
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const num = (name: string) => (form.get(name) ? Number(form.get(name)) : null);

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.patch("/profile", {
        // Contact information
        name: text("name"),
        username: text("username"),
        phone: text("phone"),
        email: text("email"),
        dateOfBirth: text("dateOfBirth"),
        yearsExperience: num("yearsExperience"),
        department: text("department"),
        designation: text("designation"),
        nidNumber: text("nidNumber"),
        languages,
        bloodGroup: text("bloodGroup"),
        gender: text("gender"),
        bio: text("bio"),
        featureOnWebsite: form.get("featureOnWebsite") === "on",

        // Address information
        addressLine1: text("addressLine1"),
        addressLine2: text("addressLine2"),
        country: text("country"),
        city: text("city"),
        state: text("state"),
        postcode: text("postcode"),

        // Appointment information
        appointmentType: text("appointmentType"),
        advanceBookingDays: num("advanceBookingDays"),
        appointmentDurationMinutes: num("appointmentDurationMinutes"),
        pricePerSession: num("pricePerSession"),
        maxBookingsPerSlot: num("maxBookingsPerSlot"),

        // Repeating sections
        education,
        awards,
        certifications,
        experience,
      });
      // "Display on website" is a request, not a switch: the profile only goes
      // live once an admin approves. Saving the rest of the form first means
      // the reviewer sees the details the consultant just entered.
      const wantsListing = form.get("isPublished") === "on";
      const alreadyLive =
        user.applicationStatus === "pending" || user.applicationStatus === "approved";
      if (wantsListing && !alreadyLive) {
        await api.post("/profile/application", {});
      } else if (!wantsListing && alreadyLive) {
        await api.delete("/profile/application");
      }

      refresh();
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((block) => (
          <div key={block} className="h-56 animate-pulse rounded-2xl bg-ink-100" />
        ))}
      </div>
    );
  }

  return (
    <form key={user.id} className="space-y-5 pb-4" onSubmit={handleSubmit}>
      {/* ------------------------------------------------ Contact information */}
      <Section title="Contact information">
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <input
            ref={avatarInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadAvatar(file);
            }}
          />
          <Avatar
            src={avatarUrl}
            initials={user.initials}
            className="h-16 w-16 text-[16px]"
          />
          <div>
            <p className="text-[12.5px] font-medium text-ink-900">Profile image</p>
            <p className="text-[11.5px] text-ink-400">
              JPG, PNG or WebP, up to 2 MB.
            </p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-1 rounded-lg border border-ink-200 px-3 py-1 text-[11.5px] font-medium text-brand-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
            >
              {uploadingAvatar ? "Uploading..." : "Change photo"}
            </button>
            {avatarError ? (
              <p className="mt-1 text-[11.5px] text-rose-600">{avatarError}</p>
            ) : null}
          </div>
        </div>

        <Grid>
          <Labelled label="Name" required>
            <input name="name" className={field} defaultValue={user.name} required />
          </Labelled>
          <Labelled label="Username">
            <input
              name="username"
              className={field}
              defaultValue={user.username}
              placeholder="forhad"
            />
          </Labelled>
          <Labelled label="Phone Number" required>
            <input name="phone" className={field} defaultValue={user.phone} required />
          </Labelled>
          <Labelled label="Email Address" required>
            <input
              name="email"
              type="email"
              className={field}
              defaultValue={user.email}
              required
            />
          </Labelled>
          <Labelled label="Date of Birth">
            <input
              name="dateOfBirth"
              type="date"
              className={field}
              defaultValue={user.dateOfBirth}
            />
          </Labelled>
          <Labelled label="Year Of Experience">
            <input
              name="yearsExperience"
              type="number"
              min={0}
              max={80}
              className={field}
              defaultValue={user.yearsExperience ?? ""}
            />
          </Labelled>
          <Labelled label="Department" required>
            <Select name="department" value={user.department} options={DEPARTMENTS} required />
          </Labelled>
          <Labelled label="Designation" required>
            <Select name="designation" value={user.designation} options={DESIGNATIONS} required />
          </Labelled>
          <Labelled label="NID Number">
            <input name="nidNumber" className={field} defaultValue={user.nidNumber} />
          </Labelled>
          <Labelled label="Language Spoken">
            <ChipInput values={languages} onChange={setLanguages} placeholder="English" />
          </Labelled>
          <Labelled label="Blood Group">
            <Select name="bloodGroup" value={user.bloodGroup} options={BLOOD_GROUPS} />
          </Labelled>
          <Labelled label="Gender">
            <Select name="gender" value={user.gender} options={GENDERS} />
          </Labelled>
        </Grid>

        <Labelled label="Bio" className="mt-4">
          <textarea
            name="bio"
            rows={4}
            placeholder="About Doctor"
            className="w-full rounded-xl border border-ink-200 p-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
            defaultValue={user.bio}
          />
        </Labelled>

        <Toggle
          name="featureOnWebsite"
          label="Feature On Website"
          defaultChecked={user.featureOnWebsite}
        />
      </Section>

      {/* -------------------------------------------- Work Experience */}
      <Section title="Work Experience">
        <RepeatingRows
          rows={experience}
          onChange={setExperience}
          blank={{ position: "", company: "", from: "", to: "", description: "" }}
          columns="sm:grid-cols-[1fr_1fr_auto_auto]"
          render={(row, update) => (
            <>
              <input
                className={field}
                placeholder="Position / Role"
                value={row.position}
                onChange={(e) => update({ position: e.target.value })}
              />
              <input
                className={field}
                placeholder="Company / Organization"
                value={row.company}
                onChange={(e) => update({ company: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={row.from}
                onChange={(e) => update({ from: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={row.to}
                onChange={(e) => update({ to: e.target.value })}
              />
              <textarea
                rows={2}
                placeholder="Describe what you did in this role"
                value={row.description}
                onChange={(e) => update({ description: e.target.value })}
                className="w-full rounded-xl border border-ink-200 p-3 text-[13px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400 sm:col-span-4"
              />
            </>
          )}
        />
      </Section>

      {/* ------------------------------------------------ Address information */}
      <Section title="Address information">
        <Grid>
          <Labelled label="Address 1">
            <input name="addressLine1" className={field} defaultValue={user.addressLine1} />
          </Labelled>
          <Labelled label="Address 2">
            <input name="addressLine2" className={field} defaultValue={user.addressLine2} />
          </Labelled>
          <Labelled label="Country">
            <input name="country" className={field} defaultValue={user.country} />
          </Labelled>
          <Labelled label="City">
            <input name="city" className={field} defaultValue={user.city} />
          </Labelled>
          <Labelled label="State">
            <input name="state" className={field} defaultValue={user.state} />
          </Labelled>
          <Labelled label="Pincode">
            <input name="postcode" className={field} defaultValue={user.postcode} />
          </Labelled>
        </Grid>
      </Section>

      {/* -------------------------------------- Appointment schedule */}
      <Section title="Appointment Schedule">
        <AppointmentSchedule />
      </Section>

      {/* -------------------------------------------- Appointment information */}
      <Section title="Appointment information">
        <Grid>
          <Labelled label="Appointment Type">
            <Select
              name="appointmentType"
              value={user.appointmentType}
              options={APPOINTMENT_TYPES}
            />
          </Labelled>
          <Labelled label="Accept bookings (in Advance)" hint="Days">
            <input
              name="advanceBookingDays"
              type="number"
              min={0}
              max={365}
              className={field}
              defaultValue={user.advanceBookingDays ?? ""}
            />
          </Labelled>
          <Labelled label="Appointment Duration" hint="Mins">
            <input
              name="appointmentDurationMinutes"
              type="number"
              min={5}
              max={480}
              step={5}
              className={field}
              defaultValue={user.appointmentDurationMinutes ?? 60}
            />
          </Labelled>
          <Labelled label={`Consultation Charge (${user.currency ?? "BDT"})`}>
            <input
              name="pricePerSession"
              type="number"
              min={0}
              step={50}
              className={field}
              defaultValue={user.pricePerSession ?? ""}
            />
          </Labelled>
          <Labelled label="Max Bookings Per Slot">
            <input
              name="maxBookingsPerSlot"
              type="number"
              min={1}
              max={50}
              className={field}
              defaultValue={user.maxBookingsPerSlot ?? 1}
            />
          </Labelled>
        </Grid>

        <Toggle
          name="isPublished"
          label="Display on Website"
          hint={
            user.applicationStatus === "pending"
              ? "Your application is under review. We will email you once an admin has looked at it."
              : user.applicationStatus === "approved"
                ? "Approved — your profile is live on the client app's Mentor page."
                : user.applicationStatus === "rejected"
                  ? `Not approved.${user.applicationNote ? ` Reason: ${user.applicationNote}` : ""} Update your profile and submit again.`
                  : "Sends your profile for admin review. It appears on the Mentor page once approved."
          }
          defaultChecked={
            user.applicationStatus === "pending" || user.applicationStatus === "approved"
          }
        />

        {user.applicationStatus === "pending" && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            Your application is under review — we will email you when a decision
            is made.
          </p>
        )}
      </Section>

      {/* -------------------------------------------- Educational information */}
      <Section title="Educational Information">
        <RepeatingRows
          rows={education}
          onChange={setEducation}
          blank={{ degree: "", university: "", from: "", to: "" }}
          columns="sm:grid-cols-[1fr_1fr_auto_auto]"
          render={(row, update) => (
            <>
              <input
                className={field}
                placeholder="Educational Degree"
                value={row.degree}
                onChange={(e) => update({ degree: e.target.value })}
              />
              <input
                className={field}
                placeholder="University"
                value={row.university}
                onChange={(e) => update({ university: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={row.from}
                onChange={(e) => update({ from: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={row.to}
                onChange={(e) => update({ to: e.target.value })}
              />
            </>
          )}
        />
      </Section>

      {/* ------------------------------------------------ Awards & Recognition */}
      <Section title="Awards & Recognition">
        <RepeatingRows
          rows={awards}
          onChange={setAwards}
          blank={{ name: "", date: "" }}
          columns="sm:grid-cols-[1fr_auto]"
          render={(row, update) => (
            <>
              <input
                className={field}
                placeholder="Name"
                value={row.name}
                onChange={(e) => update({ name: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={row.date}
                onChange={(e) => update({ date: e.target.value })}
              />
            </>
          )}
        />
      </Section>

      {/* ----------------------------------------------------- Certifications */}
      <Section title="Certifications">
        <RepeatingRows
          rows={certifications}
          onChange={setCertifications}
          blank={{ name: "", date: "" }}
          columns="sm:grid-cols-[1fr_auto]"
          render={(row, update) => (
            <>
              <input
                className={field}
                placeholder="Name"
                value={row.name}
                onChange={(e) => update({ name: e.target.value })}
              />
              <input
                className={field}
                type="date"
                value={row.date}
                onChange={(e) => update({ date: e.target.value })}
              />
            </>
          )}
        />
      </Section>

      <div className="flex items-center justify-end gap-3">
        {error ? <span className="mr-auto text-[12px] text-rose-600">{error}</span> : null}
        {saved ? (
          <span className="mr-auto text-[12px] text-emerald-600">Profile updated</span>
        ) : null}
        <Button type="reset" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ pieces */

function AppointmentSchedule() {
  const [activeDay, setActiveDay] = useState<Weekday>("Monday");
  const [schedule, setSchedule] = useState<Record<Weekday, SlotRow[]>>(blankWeek);
  const [off, setOff] = useState<Record<Weekday, boolean>>(blankOff);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const { data: monthData } = useApi<AvailabilityMonth>(
    endpoints.availability(now.getFullYear(), now.getMonth() + 1),
  );

  // Prefill each weekday from this month's first occurrence with slots.
  useEffect(() => {
    if (!monthData) return;
    setSchedule((prev) => {
      const next = { ...prev };
      for (const day of WEEKDAYS) {
        const target = WEEKDAYS.indexOf(day);
        const first = monthData.days.find(
          (entry) => ((new Date(`${entry.date}T00:00:00Z`).getUTCDay() + 6) % 7) === target,
        );
        const rows =
          first?.slots?.map((slot) => ({ start: to24(slot.start), end: to24(slot.end) })) ??
          [];
        if (rows.length) next[day] = rows;
      }
      return next;
    });
  }, [monthData]);

  const setRows = (day: Weekday, rows: SlotRow[]) => {
    setSaved(false);
    setSchedule((prev) => ({ ...prev, [day]: rows }));
  };

  const updateRow = (day: Weekday, index: number, patch: Partial<SlotRow>) =>
    setRows(
      day,
      schedule[day].map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );

  const addRow = (day: Weekday) => setRows(day, [...schedule[day], { start: "", end: "" }]);

  const removeRow = (day: Weekday, index: number) => {
    const rows = schedule[day].filter((_, rowIndex) => rowIndex !== index);
    setRows(day, rows.length ? rows : blankDay());
  };

  /** Duplicate the active day across the whole week, then publish it. */
  const applyAll = async () => {
    const next = { ...schedule } as Record<Weekday, SlotRow[]>;
    const nextOff = { ...off } as Record<Weekday, boolean>;
    for (const day of WEEKDAYS) {
      next[day] = [...schedule[activeDay]];
      nextOff[day] = off[activeDay];
    }
    setSchedule(next);
    setOff(nextOff);
    setSaved(false);
    setBusy(true);
    try {
      for (const day of WEEKDAYS) {
        if (nextOff[day]) {
          await clearPublishedSlots(day);
          continue;
        }

        const rows = next[day].filter((row) => row.start && row.end);
        if (!rows.length) continue;

        // The slots API writes one fixed duration per call, so group by it.
        const byDuration = new Map<number, string[]>();
        for (const row of rows) {
          const duration = durationOf(row);
          if (duration == null) continue;
          const times = byDuration.get(duration) ?? [];
          times.push(row.start);
          byDuration.set(duration, times);
        }

        for (const [duration, times] of byDuration) {
          await api.post("/availability/slots", {
            date: nextWeekdayISO(day),
            times,
            duration_minutes: duration,
            mode: "Online",
            repeat_weeks: 7,
          });
        }
      }
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const activeRows = schedule[activeDay];

  return (
    <>
      {/* Day tabs */}
      <div className="mb-8 flex flex-wrap gap-3">
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setActiveDay(day)}
            className={cn(
              "rounded-lg px-6 py-2 text-sm font-semibold transition-all",
              activeDay === day
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200",
            )}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Day off toggle */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={off[activeDay]}
            onChange={(event) => {
              setSaved(false);
              setOff((prev) => ({ ...prev, [activeDay]: event.target.checked }));
            }}
            className="peer sr-only"
          />
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              off[activeDay] ? "bg-emerald-500" : "bg-ink-200",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                off[activeDay] ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
          <span className="text-[13px] font-medium text-ink-900">
            Day off{" "}
            <span className="font-normal text-ink-400">
              — no slots published on {activeDay}
            </span>
          </span>
        </label>
      </div>

      {off[activeDay] ? (
        <p className="mb-6 rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
          {activeDay} is a day off. Existing published slots for the next 8 weeks will be
          removed when you save.
        </p>
      ) : (
        /* Time slot rows */
        <div className="mb-6 space-y-4">
          {activeRows.map((row, index) => (
          <div key={index} className="flex flex-col items-end gap-3 md:flex-row md:items-end">
            <div className="w-full md:flex-1">
              {index === 0 ? (
                <label className="mb-3 block text-sm font-bold text-ink-700">From</label>
              ) : null}
              <input
                type="time"
                value={row.start}
                onChange={(event) => updateRow(activeDay, index, { start: event.target.value })}
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="w-full md:flex-1">
              {index === 0 ? (
                <label className="mb-3 block text-sm font-bold text-ink-700">To</label>
              ) : null}
              <input
                type="time"
                value={row.end}
                onChange={(event) => updateRow(activeDay, index, { end: event.target.value })}
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex gap-2 pb-1">
              <button
                type="button"
                aria-label="Add time slot"
                onClick={() => addRow(activeDay)}
                className="rounded-xl bg-ink-100 p-3 text-ink-500 transition-colors hover:bg-ink-200"
              >
                <Plus size={20} />
              </button>
              {activeRows.length > 1 ? (
                <button
                  type="button"
                  aria-label="Remove time slot"
                  onClick={() => removeRow(activeDay, index)}
                  className="rounded-xl bg-rose-50 p-3 text-rose-500 transition-colors hover:bg-rose-100"
                >
                  <Trash2 size={20} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void applyAll()}
          className="rounded-lg bg-ink-900 px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {busy ? "Saving..." : "Apply All"}
        </button>
        {saved ? (
          <span className="text-[12px] text-emerald-600">
            Schedule published for the next 8 weeks
          </span>
        ) : null}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-[14px] font-semibold text-ink-900">{title}</h2>
      {children}
    </Card>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Labelled({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-700">
        <span>
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </span>
        {hint ? <span className="text-ink-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Select({
  name,
  value,
  options,
  required,
}: {
  name: string;
  value: string;
  options: string[];
  required?: boolean;
}) {
  // Keep whatever is stored even if it is not in the preset list.
  const list = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select name={name} className={field} defaultValue={value} required={required}>
      <option value="">Select</option>
      {list.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="mt-4 flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-ink-200"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
      <span>
        <span className="block text-[13px] font-medium text-ink-900">{label}</span>
        {hint ? <span className="block text-[11.5px] text-ink-500">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Chip list used for "Language Spoken" — type and press Enter. */
function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) return setDraft("");
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-ink-200 px-2 py-1.5 focus-within:border-brand-400">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[11.5px] text-brand-600"
        >
          {value}
          <button
            type="button"
            aria-label={`Remove ${value}`}
            onClick={() => onChange(values.filter((v) => v !== value))}
            className="text-brand-400 hover:text-brand-600"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={values.length ? "" : placeholder}
        className="min-w-[80px] flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-ink-400"
      />
    </div>
  );
}

/** Add/remove rows for education, awards and certifications. */
function RepeatingRows<T extends object>({
  rows,
  onChange,
  blank,
  columns,
  render,
}: {
  rows: T[];
  onChange: (next: T[]) => void;
  blank: T;
  columns: string;
  render: (row: T, update: (patch: Partial<T>) => void) => ReactNode;
}) {
  const list = rows.length ? rows : [blank];

  const update = (index: number, patch: Partial<T>) => {
    const next = [...list];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {list.map((row, index) => (
        <div key={index} className={`grid items-center gap-3 ${columns}`}>
          {render(row, (patch) => update(index, patch))}
          <div className="flex gap-1">
            {list.length > 1 ? (
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => onChange(list.filter((_, i) => i !== index))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-rose-500 transition-colors hover:border-rose-300"
              >
                ×
              </button>
            ) : null}
            {index === list.length - 1 ? (
              <button
                type="button"
                aria-label="Add row"
                onClick={() => onChange([...list, blank])}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-brand-500 transition-colors hover:border-brand-300"
              >
                <PlusIcon width={15} height={15} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
