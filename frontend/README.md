# Hangout frontend

React + TypeScript + Vite + React Router + Socket.IO client, styled with plain CSS.

See the [project README](../README.md) for setup and limitations, [architecture](../docs/architecture.md) for structure, and [TODO checklist](../docs/TODO.md) for completion status.

```bash
npm ci
cp .env.example .env
npm run dev
```

Use `npm run typecheck` and `npm run build` for validation. `npm run preview` serves the built bundle locally. The backend and PostgreSQL must run separately for account/room actions. Frontend tests are still planned; the empty Create React App test scaffolding was removed during migration.
