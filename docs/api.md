# HTTP API

## Implemented

Default base: `http://localhost:5000`. These legacy account/room endpoints still lack server session authentication.

| Method | Path | Input / behavior |
| --- | --- | --- |
| GET | `/` | Welcome message |
| GET | `/health` | `{ ok: true }`; process health only |
| POST | `/api/signup` | name/email/password; hashes password and inserts user |
| POST | `/api/login` | email/password; returns user id/name on success, no session |
| POST | `/api/reset-password` | Returns 501; disabled pending verified recovery |
| POST | `/api/rooms/create` | name; returns roomCode; password ignored |
| GET | `/api/rooms/join/:code` | Looks up room; does not register membership |
| DELETE | `/api/rooms/close/:roomCode` | Deletes room without ownership check |

Existing response shapes are preserved. Invalid JSON, oversized bodies, and unknown paths receive JSON errors. Comprehensive runtime validation and unified error codes remain pending.

## Target — not implemented

- `/api/auth`: register, login, logout, current user, forgot/reset password.
- `/api/users/me`: profile/settings read/update and account deletion.
- `/api/rooms`: create and list authorized rooms.
- `/api/rooms/:code`: details, host-managed settings, host-only closure.
- `/api/rooms/:code/join` and `/leave`: explicit membership changes.
- Room members: participant list, authorized removal, role changes, host transfer.
- Room messages: paginated history and validated creation through shared services.
- Room queue: list/add/remove/reorder with permission checks.
- Favorites and notifications: user-scoped CRUD/read-state operations.

Use a consistent public room identifier, pagination, stable error codes, and server-side access filtering. Never return password hashes, session values, or internal database errors. Keep HTTP/socket permission rules in shared services.

## Expanded API groups — proposed only

Future service-backed routes will cover invite creation/redemption/revocation, join approvals/bans, room policy and roles, chat reactions/pins/search, polls/votes, saved queues, scheduled/recurring rooms, reminders, own-device handoff, private history/progress, chapters/notes/moments, memories, privacy preferences, and authorized diagnostics/analytics. Optional voice access and AI jobs require separate contracts and provider decisions.

Define exact methods/payloads alongside implementation. Apply server authorization to every read/write, use pagination for lists, and use atomic/idempotent operations for single-use invite redemption, votes, reminders, and device handoff. Search must filter inaccessible rooms and private history. Guest access needs explicit limited identity and permissions.
