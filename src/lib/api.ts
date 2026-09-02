const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/** Exposed so the sign-in redirect can leave the SPA for the server. */
export const API_BASE_URL = BASE_URL;

type Json = Record<string, unknown>;

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // The session is an httpOnly cookie, so it has to ride along with every call.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    onUnauthorized?.();
  }

  if (!response.ok) {
    throw new Error(
      (payload as { error?: string }).error ??
        `Request failed with status ${response.status}`,
    );
  }

  return (payload as { data: T }).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: Json) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: Json) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/* ------------------------------------------------------------------ types */

export type AppointmentStatus = "upcoming" | "past" | "cancelled";

export type Appointment = {
  id: string;
  date: string;
  year: number;
  month: number; // 0-indexed, ready for the calendar helpers
  day: number;
  start: string;
  end: string;
  client: string;
  clientEmail?: string | null; // present when booked by a registered client
  registered?: boolean;
  attachments?: { cv_id: string; title: string }[];
  issue: string;
  documents: boolean;
  status: AppointmentStatus;
  mode: "Online" | "In person";
  note: string | null;
  meetingLink?: string | null; // set once the console created the Meet space
};

export type AvailabilityDay = {
  day: number;
  date: string;
  holiday: boolean;
  slots: { id: string; start: string; end: string; mode: string }[];
};

export type AvailabilityMonth = {
  year: number;
  month: number; // 1-indexed, as the API returns it
  days: AvailabilityDay[];
  holidays: number[];
};

export type ConsultSession = {
  id: string;
  label: "Online" | "In person";
  start: string;
  end: string;
  dateLabel: string;
  group: string;
};

export type ClientStatus = "Stable" | "Follow-up" | "Closed";

export type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  jobTitle: string;
  age: number | null;
  code: string | null;
  package: string;
  registered: boolean;
  sessions: number;
  issue: string;
  /** ISO dates, or null when there is none yet */
  lastConsult: string | null;
  nextAppointment: string | null;
  lastSeen: string;
  status: ClientStatus;
  /** Consultant-authored note (client_records) */
  note: string;
  /** Note the client wrote while booking their most recent session */
  bookingNote?: string | null;
  avatarUrl?: string | null;
  attachments: { cv_id?: string; title?: string; storage_path?: string }[];
};

export type ClientDetail = ClientRecord & {
  resumes: {
    id: string;
    title: string;
    updatedAt: string | null;
    /** Present when the file lives in storage and can be opened via signed URL */
    storagePath?: string | null;
  }[];
};

export type ConsultStat = { label: string; value: string; delta: string };

export type Profile = {
  id: string;
  name: string;
  shortName: string;
  role: string;
  email: string;
  phone: string;
  timezone: string;
  bio: string;
  skills: string[];
  avatarUrl: string | null;
  pricePerSession?: number | null;
  currency?: string;
  isPublished?: boolean;
  initials: string;

  // Contact information
  username: string;
  dateOfBirth: string;
  yearsExperience: number | null;
  department: string;
  designation: string;
  nidNumber: string;
  languages: string[];
  bloodGroup: string;
  gender: string;
  featureOnWebsite: boolean;

  // Address information
  addressLine1: string;
  addressLine2: string;
  country: string;
  city: string;
  state: string;
  postcode: string;

  // Appointment information
  appointmentType: string;
  onlineConsultEnabled: boolean;
  advanceBookingDays: number | null;
  appointmentDurationMinutes: number | null;
  maxBookingsPerSlot: number | null;

  // Repeating sections
  education: { degree: string; university: string; from: string; to: string }[];
  awards: { name: string; date: string }[];
  certifications: { name: string; date: string }[];
  experience: { position: string; company: string; from: string; to: string; description: string }[];
};

/* --------------------------------------------------------------- endpoints */

export const endpoints = {
  appointments: (params: { status?: AppointmentStatus; year?: number; month?: number }) => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.year) search.set("year", String(params.year));
    if (params.month) search.set("month", String(params.month));
    const query = search.toString();
    return `/appointments${query ? `?${query}` : ""}`;
  },
  availability: (year: number, month: number) =>
    `/availability?year=${year}&month=${month}`,
  upcomingSessions: "/sessions/upcoming",
  clients: (search?: string) =>
    `/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`,
  client: (key: string) => `/clients/${encodeURIComponent(key)}`,
  resumeUrl: (key: string, path: string) =>
    `/clients/${encodeURIComponent(key)}/resume-url?path=${encodeURIComponent(path)}`,
  stats: "/stats",
  profile: "/profile",
};
