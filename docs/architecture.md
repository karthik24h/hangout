# Architecture

## Current structure

```text
hangout/
├── frontend/
│   ├── index.html                 # Vite HTML entry
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── main.tsx               # React startup
│       ├── app/App.tsx            # Page routes
│       ├── components/
│       │   ├── auth/PrivateRoute.tsx
│       │   ├── layout/Header.tsx
│       │   └── room/              # Create/join dialogs
│       ├── pages/                 # Home, music, videos, favorites, settings
│       │   └── auth/              # Login and signup
│       ├── hooks/                 # Connection status lifecycle
│       ├── services/api.ts        # Configurable HTTP base
│       ├── socket/client.ts       # Typed socket factory
│       └── styles/                # Existing CSS preserved
├── backend/
│   ├── .env.example
│   ├── tsconfig.json
│   ├── test/                      # Foundation tests
│   └── src/
│       ├── server.ts              # HTTP startup, sockets, shutdown
│       ├── app.ts                 # Express middleware and routes
│       ├── config/                # Environment validation and DB pool
│       ├── routes/                # Account and room handlers
│       ├── websocket/index.ts     # Public connection diagnostics
│       └── utils/roomCode.ts      # Random six-character room code
├── shared/socket.ts              # Browser-safe event types
└── docs/
```

React mounts through `main.tsx`; `App.tsx` selects routes. `/`, `/music`, `/videos`, `/favorites`, and `/settings` have a legacy browser flag guard. `/login` and `/signup` are public. React state holds temporary input/modal state. localStorage stores the legacy login flag and last created room code. PostgreSQL stores users and rooms.

## Target architecture — remaining work

```text
React application shell / pages / reusable components
       | typed HTTP client        | authenticated Socket.IO client
       v                          v
Express routes              Socket event handlers
       | validation / session / membership / role checks
       +------------ shared services ------------+
                       |
                database queries / transactions
                       |
                   PostgreSQL
```

Add `controllers/`, `services/`, `middleware/`, and `db/migrations/` to the backend when their behavior is implemented. Add frontend `context/`, common UI, media, chat, and room components incrementally. Do not create empty folders to imply feature completion.

Use TypeScript for application logic and TSX for components. Shared contracts must not import server secrets or database clients. Compile-time types do not replace runtime payload validation.

## Authentication plan

Use opaque server-managed sessions persisted in PostgreSQL. Configure HttpOnly cookies, production Secure, expiration/renewal, explicit logout invalidation, and CSRF/origin protections. `/api/auth/me` should populate an AuthProvider; route guards must wait for that check. HTTP and Socket.IO must validate the same session, including expiration and revocation.

Room handlers must check membership and current permissions on every operation. Host controls playback, queue moderation, member removal, transfer, and closure. Moderators receive explicit moderation permissions. Members chat, leave, and add media when allowed. Client-supplied role or identity is never authoritative.

## Services and data ownership

PostgreSQL is the source of truth for accounts, membership, messages, queue, and playback state. Socket.IO broadcasts committed changes. HTTP and socket handlers should use the same services to prevent divergent permissions. Media bytes come from supported URLs; the app sends control events rather than proxying video.

Start with one server process. Multiple instances need shared event coordination and an authoritative state strategy before scaling. Presence is ephemeral and must account for multiple tabs.

## Migration decisions

The foundation migrated from JavaScript/CRA to strict TypeScript/Vite and separated Express startup from routes/configuration. Existing account/create/join/close URL shapes were retained. Unsafe password reset was disabled. Existing CSS and screen appearance were preserved; broad UI redesign is pending.

Database schema changes were deliberately not applied to the uninspected existing database. Next steps are versioned migrations, runtime validation, and real authentication before private real-time features.
