# HR Dashboard — Consultant Console (Client)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

A modern, responsive consultant dashboard for managing career consulting sessions, client records, availability, and online consultations. Built with React 19, TypeScript, and Tailwind CSS v4.

> **Part of a monorepo** — this is the frontend for the [HR Dashboard Consultant Console](https://github.com/ZawadulAmanHredoy/HR_Dashboard_Server). The app runs with no configuration: sign in with demo mode and browse the full UI out of the box.

## Features

- **Dashboard** — View upcoming, past, and cancelled appointments with reschedule, cancel, and note-taking actions. Tab-based filtering and month picker for quick navigation.
- **Availability Management** — Calendar and classic grid views for managing time slots (30/45/60 min), modes (Online / In person), weekly repeat, and holiday marking.
- **Client Records** — Searchable client table with avatar, status tracking (Stable / Follow-up / Closed), booking facts, editable notes, and resume/CV viewer.
- **Consult History** — Stat tiles (total consults, hours delivered, avg. rating, repeat clients) and full consult history list.
- **Online Consultation** — Enable/disable online consults, set durations (15–90 min), and configure fees.
- **Profile Management** — Full profile editor for contact info, address, education, awards, certifications, avatar upload, and appointment settings.
- **Authentication** — Google OAuth sign-in with demo mode fallback. Session managed via httpOnly JWT cookie.
- **Responsive UI** — Sidebar-based layout with sticky topbar, backdrop blur, mobile hamburger menu, and loading skeletons on all data screens.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| TypeScript 6 | Type safety |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling with custom theme tokens (`brand-*`, `ink-*`, `canvas`) |
| React Router 7 | Client-side routing with `RequireAuth` route guard |
| OxLint | Fast Rust-based linting |
| Geist Font | Typography |

## Project Structure

```
src/
├── main.tsx                 # App entry point (StrictMode)
├── App.tsx                  # Route definitions + providers
├── index.css                # Tailwind theme + custom design tokens
├── env.d.ts                 # Vite env type declarations
├── lib/
│   ├── api.ts               # API client (fetch wrapper) + TypeScript types + endpoint builders
│   ├── cn.ts                # Classname utility (filter + join)
│   ├── constants.ts         # Demo year/month pins (DEMO_YEAR=2026, AVAILABILITY_MONTH=Nov 2026)
│   └── date.ts              # Calendar matrix, month labels, weekday helpers
├── hooks/
│   └── useApi.ts            # Generic data-fetching hook (data / loading / error / refresh) + usePageTitle
├── context/
│   ├── auth-context.ts      # AuthUser, AuthMode, AuthState types + createContext
│   ├── AuthProvider.tsx     # Auth: session load, Google sign-in redirect, demo sign-in, sign-out
│   ├── profile-context.ts   # ProfileState type + FALLBACK_PROFILE
│   └── ProfileProvider.tsx  # Profile data provider using useApi hook
├── components/
│   ├── auth/
│   │   └── RequireAuth.tsx  # Route guard — redirects to /login, returns to original page after
│   ├── layout/
│   │   ├── AppShell.tsx     # Main layout: sticky sidebar + topbar + <Outlet />
│   │   ├── Sidebar.tsx      # Navigation sidebar (7 items + logout)
│   │   └── Topbar.tsx       # Greeting, page title, language menu, notifications, user menu
│   ├── ui/
│   │   ├── Button.tsx       # primary / secondary / ghost / outline, sm / md
│   │   ├── Card.tsx         # Card + CardHeader
│   │   ├── Badge.tsx        # brand / green / amber / gray / red tones
│   │   ├── Menu.tsx         # Dropdown with auto flip-up detection
│   │   └── Segmented.tsx    # Tab switcher
│   ├── dashboard/
│   │   ├── DashboardView.tsx        # Tab bar, month picker, appointment list, note modal
│   │   └── NewAppointmentModal.tsx   # Create/edit appointment with client search autocomplete
│   └── availability/
│       ├── AvailabilityView.tsx     # Calendar/classic view switch, slot CRUD, holiday toggle
│       ├── CalendarMonth.tsx        # Monthly grid with slot pills and holiday labels
│       ├── DayEditor.tsx            # Day detail: existing slots, add form, holiday toggle
│       ├── UpcomingPanel.tsx        # Sidebar: upcoming sessions grouped by day
│       └── LegacyGrid.tsx           # Classic week-based grid with holiday marking mode
└── pages/
    ├── Login.tsx             # Sign-in: Google button + demo mode fallback
    ├── Dashboard.tsx         # Dashboard page wrapper
    ├── Availability.tsx      # Availability page wrapper
    ├── ClientRecords.tsx     # Client list with search, status badges, detail links
    ├── ClientDetails.tsx     # Client profile, booking facts, resume viewer, notes
    ├── Consults.tsx          # Stat tiles + consult history list
    ├── OnlineConsult.tsx     # Consultation settings (enable/disable, duration, fees)
    ├── Profile.tsx           # Full profile editor (contact, address, education, avatar)
    └── Help.tsx              # Topic cards + FAQ accordion
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running ([Server Repo](https://github.com/ZawadulAmanHredoy/HR_Dashboard_Server))

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the client root (optional — defaults work for local dev):

```env
# Override the API base URL (defaults to /api, proxied by Vite in dev)
# VITE_API_URL=https://your-api.example.com/api

# Override the Vite dev proxy target (defaults to http://localhost:4000 in vite.config.ts)
# VITE_API_PROXY=http://localhost:3000
```

The client holds **no credentials** — sign-in runs entirely on the Express server and the session lives in an httpOnly cookie the browser cannot read.

### Development

```bash
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173) and proxies `/api` requests to the backend Express server on port 3000.

### Build

```bash
npm run build
```

Runs `tsc -b && vite build`. Output is generated in the `dist/` directory.

### Lint

```bash
npm run lint
```

Uses OxLint (Rust-based linter).

### Preview Production Build

```bash
npm run preview
```

## API Proxy

All `/api` requests are proxied to the backend server defined in `VITE_API_PROXY` (default: `http://localhost:3000`). This ensures cookie-based authentication works seamlessly in development.

## Design System

Design tokens live in the `@theme` block of `src/index.css`:

| Token | Purpose |
|---|---|
| `brand-*` | Purple ramp (50–950) for primary actions |
| `ink-*` | Neutral grays for text |
| `canvas` | Background color |

## Notes

- Demo data is pinned to 2026 (appointments in May/June, availability in November) — see `src/lib/constants.ts`.
- The `RequireAuth` component handles the full auth flow: checks `/api/auth/session`, redirects to `/login` if unauthenticated, and returns the user to the originally requested page after sign-in.

## License

This project is private and proprietary.
