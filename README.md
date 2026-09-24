# Hangout

Hangout is a work-in-progress app for private watch and music parties. Friends will be able to join rooms, chat, manage a shared queue, and watch or listen together.

**Stack:** React + TypeScript + Node.js/Express + PostgreSQL + Socket.IO, with Vite and plain CSS.

**Status:** the TypeScript and real-time connection foundation is implemented. Existing signup/login and basic room endpoints have been retained. Secure sessions, live chat, room membership, and synchronized playback are still unfinished. Do not treat the current prototype as production-ready.

## Documentation

- [Architecture and folder structure](docs/architecture.md)
- [Checked implementation roadmap](docs/TODO.md)
- [Expanded feature roadmap — 30 planned experiences](docs/features.md)
- [Platform operations console — permissions, nonstandard route, and 20 planned areas](docs/admin-console.md)
- [HTTP API](docs/api.md)
- [Database design](docs/database.md)
- [Real-time events and synchronization](docs/realtime.md)
- [Design system and screen plan](docs/design-system.md)

## Technologies in plain English

| Technology | What it does |
| --- | --- |
| TypeScript / TSX | JavaScript with development-time type checks; TSX describes React screens |
| React 19 / React DOM | Build and display the browser interface |
| React Router 6 | Navigate between screens |
| HTML / CSS | Page structure, layout, colors, and styling |
| Vite 7 | Frontend development server and production bundler |
| Node.js / Express 5 | Execute backend code and handle HTTP requests |
| PostgreSQL / SQL | Store account and room records |
| pg | Connect the server to PostgreSQL using a connection pool |
| bcrypt | Hash passwords and compare login credentials |
| Socket.IO 4 | Current connection diagnostics; future chat/presence/media events |
| Fetch / JSON | Exchange HTTP requests and structured data |
| dotenv | Load backend environment configuration |
| tsx / TypeScript compiler | Run backend TypeScript in development and compile it for deployment |
| Node test runner | Run foundation configuration, HTTP, and socket tests |

Plain CSS is retained. Tailwind is not configured; some old utility-style class names still need cleanup. The audio player uses `react-h5-audio-player`; video uses the browser's native player. Sample media and DiceBear avatars load directly from external providers.

## Architecture

```text
Browser: React + TypeScript + CSS
    | HTTP / JSON            | Socket.IO diagnostics
    +------------------------+
                |
Node HTTP server: Express + Socket.IO
    | routes / configuration / error handling
    | pg / parameterized SQL
    v
PostgreSQL: users and rooms
```

Socket.IO does not stream video/audio bytes. Future synchronization sends playback commands while browsers load supported media sources themselves.

## What currently works in source

- Account signup with password hashing and login credential checks.
- Basic create/find/delete room endpoints and matching browser dialogs.
- Music/video screens with fixed sample sources, copy-room-code control, and navigation.
- TypeScript checks for both applications and shared socket event types.
- Environment-based API/database configuration, bounded JSON bodies, explicit frontend CORS origin, and a health endpoint.
- Socket server/client wiring and visible server connection status.
- Logout now clears the legacy browser flags; settings uses the existing route guard.

Room passwords, real chat, queue editing, profile/settings persistence, favorites, membership, and shared playback are **not implemented**. Join currently opens the video page regardless of room type. Displayed room cards, profile details, and chat are examples.

## Setup

Use Node **22.22.1** (`.nvmrc`) and npm. PostgreSQL runs separately.

```bash
cd frontend
npm ci
cp .env.example .env
cd ../backend
npm ci
cp .env.example .env
```

Edit `backend/.env` with your real database connection. Never commit `.env` or put secrets into frontend variables. Frontend `VITE_*` values are public and embedded at build time.

The existing database must contain compatible `users` and `rooms` tables. A fresh project still needs a schema setup: versioned migrations are on the TODO list, not supplied by `npm install`. See [database prerequisites](docs/database.md). The old `backend/database.db` is not used.

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another:

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:3000`. Backend: `http://localhost:5000`. `npm start` also starts the frontend development server.

## Build and checks

```bash
npm --prefix frontend run typecheck
npm --prefix frontend run build
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend test
```

For a compiled backend, run `npm start` **inside backend** so dotenv finds its local `.env`. Frontend build output is `frontend/dist`; backend output is `backend/dist`. Configure production hosting to fall back to `index.html` for React routes and support Socket.IO connections at the backend.

Validation completed for this migration: frontend type check/build, backend compilation, and all three foundation tests passed. Local documentation links and diff whitespace checks passed. Dependency updates cleared the backend audit; the frontend audit still reports two moderate React Router findings that require evaluating a major-version upgrade.

Tests cover foundation behavior without a running database. Full signup/login/room database integration and browser interaction tests remain pending. `/health` is a process health check, not a database readiness check.

## Configuration

| File | Variable | Purpose |
| --- | --- | --- |
| frontend/.env | VITE_API_URL | API base, including `/api` |
| frontend/.env | VITE_SOCKET_URL | Backend socket origin |
| backend/.env | DATABASE_URL | Required PostgreSQL connection string |
| backend/.env | PORT | HTTP/socket port, default 5000 |
| backend/.env | FRONTEND_URL | Allowed browser origin, default http://localhost:3000 |

Restart development servers after changing configuration. Existing hardcoded database credentials have been removed. The legacy unverified password-reset endpoint now returns 501 until secure recovery is implemented.

## Security and remaining work

The frontend still uses a localStorage login flag. That is a UI gate, **not server authentication**. Room endpoints do not verify ownership. The socket foundation intentionally exposes only public diagnostics, no room data. Implement real sessions, authorization, password recovery, validation, and rate limits before adding private room events or deploying publicly.

Follow [the roadmap](docs/TODO.md): foundation → secure authentication → UI shell → persistent rooms → authenticated chat/presence → synchronized media → personal features → release checks.

Technical references: [Vite environment configuration](https://vite.dev/guide/env-and-mode), [Socket.IO server setup](https://socket.io/docs/v4/server-initialization/), and [Socket.IO TypeScript contracts](https://socket.io/docs/v4/typescript/).

## Expanded product scope

The [expanded roadmap](docs/features.md) adds cinematic rooms, floating reactions, voice, advanced chat, collaborative queue voting, polls, richer invites, privacy/guest roles, mobile and device handoff, scheduling/recurrence, themes, diagnostics, chapters, notes, saved moments, memories, and optional analytics/AI. These are planned features with unchecked tasks, not claims of current functionality. Secure membership and the authoritative real-time room engine come first.

## Planned operations console

The [console plan](docs/admin-console.md) covers management, moderation, reports, audit, health, security, settings, and phased operational tools. Its proposed entry is `/ops/lantern-7c42/login`, with no `/admin` alias. This route is not implemented and is not a security boundary: privileged server sessions, MFA, and API/socket permissions must come first. All console work is unchecked in the roadmap.
