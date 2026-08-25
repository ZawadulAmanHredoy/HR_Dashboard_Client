# HR Dashboard — Consultant Console (Client)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

A modern, responsive consultant dashboard for managing career consulting sessions, client records, availability, and online consultations. Built with React 19, TypeScript, and Tailwind CSS v4.

## Features

- **Dashboard** — View upcoming, past, and cancelled appointments with reschedule, cancel, and note-taking actions
- **Availability Management** — Calendar and classic grid views for managing time slots, durations, modes, and holidays
- **Client Records** — Searchable client table with status tracking (Stable / Follow-up / Closed) and detailed client profiles
- **Consult History** — Statistics tiles and consult history with scheduling status
- **Online Consultation** — Enable/disable online consults, set durations, and configure fees
- **Profile Management** — Full profile editor for contact info, address, education, awards, certifications, and appointment settings
- **Authentication** — Google OAuth sign-in with demo mode fallback
- **Responsive UI** — Clean, sidebar-based layout with sticky topbar and mobile support

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI library |
| TypeScript 6 | Type safety |
| Vite 8 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling |
| React Router 7 | Client-side routing |
| OxLint | Fast Rust-based linting |
| Geist Font | Typography |

## Project Structure

```
src/
├── main.tsx                 # App entry point
├── App.tsx                  # Route definitions + providers
├── index.css                # Tailwind theme + custom tokens
├── lib/
│   ├── api.ts               # API client & TypeScript types
│   ├── cn.ts                # Classname utility
│   ├── constants.ts         # Demo constants
│   └── date.ts              # Date utilities
├── hooks/
│   └── useApi.ts            # Generic data-fetching hook
├── context/
│   ├── auth-context.ts      # Auth types & context
│   ├── AuthProvider.tsx     # Auth state management
│   ├── profile-context.ts   # Profile context
│   └── ProfileProvider.tsx  # Profile data provider
├── components/
│   ├── auth/                # Auth guards
│   ├── layout/              # AppShell, Sidebar, Topbar
│   ├── ui/                  # Reusable UI components
│   ├── dashboard/           # Dashboard & appointment modals
│   └── availability/        # Calendar, day editor, grids
└── pages/                   # Route-level page components
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see [Server Repo](https://github.com/ZawadulAmanHredoy/HR_Dashboard_Server))

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_PROXY=http://localhost:4000
```

### Development

```bash
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173) and proxies `/api` requests to the backend.

### Build

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Lint

```bash
npm run lint
```

## API Proxy

All `/api` requests are proxied to the backend server defined in `VITE_API_PROXY`. This ensures cookie-based authentication works seamlessly in development.

## License

This project is private and proprietary.
