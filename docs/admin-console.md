# Platform operations console — planned

This plan incorporates the 20-part admin proposal. **No console routes, privileged APIs, admin roles, or admin authentication are implemented yet.** The TypeScript backend is already split into app, startup, configuration, routes, and socket modules; the proposal’s reference to a single `server.js` describes the old code.

## Nonstandard route choice

Use **`/ops/lantern-7c42`** as the proposed console base instead of `/admin`.

```text
/ops/lantern-7c42/login
/ops/lantern-7c42/dashboard
/ops/lantern-7c42/users
/ops/lantern-7c42/rooms
/ops/lantern-7c42/reports
/ops/lantern-7c42/security
```

Other console sections live beneath the same base. Do not create an `/admin` alias or redirect. Keep console links out of ordinary-user navigation; authorized operators receive the entry address through onboarding. A future deployment may configure `CONSOLE_BASE_PATH` and a matching frontend route value, but neither variable is currently wired. Configure one canonical base rather than scattering literals through components.

**A nonstandard URL reduces casual guessing; it does not make the console secret.** Routes can be found in browser bundles, network requests, logs, or shared links. Do not place a password/API key in the URL. A frontend route path or `VITE_*` variable is public. Require server authorization even for someone who knows the exact URL. Do not rely on robots.txt, hidden buttons, or localStorage flags as protection.

## Security gate before enabling any console

1. Implement server-managed sessions and database-backed platform permissions.
2. Provision the initial privileged account through an operator-controlled bootstrap, with no public promotion or default admin password.
3. Implement a separate privileged login flow with MFA, rate limiting, CSRF/origin defenses, secure cookies, idle/absolute timeouts, and revocation.
4. Verify required permissions on every console API and any privileged socket subscription/action. Recheck role changes and revocations for active connections.
5. Use step-up authentication and explicit confirmation for destructive or platform-wide actions. Log success and failure without recording secrets.
6. Add denied-access tests before shipping the shell. Hiding navigation is only a UI concern.

Anonymous users reaching the console UI can be directed to its login screen; authenticated users without privileges receive a generic denied/not-found view. APIs return a consistent unauthenticated/forbidden response without sensitive data. Do not expose a privileged registration form.

## Platform permissions

| Platform role | Intended scope |
| --- | --- |
| USER | Ordinary application operations; no console access |
| MODERATOR | Assigned reports, reported-message review/removal, permitted participant removal, bounded temporary restrictions |
| ADMIN | User/room management, moderator management, permitted settings, analytics, announcements |
| SUPER_ADMIN | Admin provisioning, critical security/settings, full authorized audit access, maintenance/global controls |

Room roles and platform roles are separate. A room host cannot grant platform admin access. Prevent self-escalation, unauthorized peer/superior changes, and removal of the last enabled super admin. An admin’s ability to manage users does not automatically grant access to all private chat/history: use purpose-bound moderation access and log sensitive reads.

## Delivery stages

| Stage | Deliverables |
| --- | --- |
| Prerequisites | Real sessions, migrations, permission service, privileged bootstrap, MFA, audit pipeline |
| V1 | Secure login, shell/profile, dashboard, users, rooms, reports, basic moderation/restrictions, roles, audit, health |
| V2 | Analytics, announcements, media management, richer security center, administrator-management UI, settings, maintenance, flags |
| V3 | Advanced analytics/security monitoring, backup orchestration, usage/cost analytics, experimentation, optional automated/AI moderation assistance |

Basic privileged-account provisioning and session security are prerequisites, even though the richer management interface is V2. Optional AI moderation should assist human decisions under an explicit data/appeal policy, not silently impose irreversible sanctions.

## A01 — Dashboard

Account totals, new/active users, online users, room totals/activity, messages/media, pending reports, suspensions, socket connections, service state, and a permission-filtered activity feed.

## A02 — User management

Search/filter/sort/paginate users; view profile, created/joined rooms, reports, and permitted activity; enable/disable, suspend/unsuspend, delete, force logout, revoke sessions, and change authorized roles.

## A03 — Roles and permissions

Separate platform USER, MODERATOR, ADMIN, and SUPER_ADMIN roles from room HOST, MODERATOR, MEMBER, and GUEST roles. Enforce explicit permissions, not only role names.

## A04 — Room management

Authorized room metadata, participants, activity/reports, media/session details, and measured connection state; close, lock/unlock, remove members, transfer ownership, and change permitted settings.

## A05 — Reports

Report users, messages, rooms, media, profiles, or behavior; triage pending → reviewing → action taken → resolved, or dismiss with a reason. Record reviewer, evidence references, timestamps, and outcomes.

## A06 — Chat moderation

Review reported content, remove messages, lock chat, apply slow mode or approval, restrict/mute users, and pin announcements with reasons and auditable permissions.

## A07 — Bans and restrictions

Account suspensions, room bans, chat/voice restrictions, and permanent bans with scope, reason, start/end time, issuer, expiry/revocation, and enforcement on HTTP and active sockets.

## A08 — Media management

Search media, inspect metadata/usage/categories, disable/remove problematic items, and manage supported metadata. If uploads ship, show storage usage, sizes/types, limits, and failures.

## A09 — Announcements and notifications

Compose maintenance, security, and feature announcements for everyone, active users, selected users, or moderators. Preview audience/content before sending; track status and deduplicate retries.

## A10 — Analytics

User growth/retention, active users, room creation/size/duration, messages, reactions, plays, joins, and media usage. Define metrics/windows, minimize personal data, and respect retention/access policy.

## A11 — Audit logs

Record actor, action, target, time, reason, result, safe before/after values, and appropriate session/IP references. Append-only for application roles; no ordinary edit/delete UI.

## A12 — System health

Real API/database/socket/auth health, request rates, rooms/connections, and available CPU/memory/disk metrics. Show storage/Redis only if deployed; distinguish unavailable metrics from healthy services.

## A13 — Platform settings

Registration/verification/password policies, room sizes/types/guests, chat/reactions/GIFs/mentions, queue/upload limits, and validated versioned configuration changes.

## A14 — Security center

Session revocation, global logout, session durations, rate-limit policy, failed-login/security events, optional IP restrictions, mandatory privileged-account MFA, and admin session management.

## A15 — Administrator management

Provision moderators, promote/demote/disable authorized accounts, revoke privileged sessions, and manage permissions. Only super admins manage admins/super admins; protect the last enabled super admin.

## A16 — Separate admin authentication

Dedicated login at the nonstandard console path, server-verified privileged session, MFA, rate limits, idle/absolute expiry, step-up authentication, audit events, and server logout/revocation.

## A17 — Maintenance mode

Operator-controlled status/message with preview and audit, predictable user/API/socket behavior, and a narrowly authorized console recovery path that remains available during maintenance.

## A18 — Backup and database operations

Show actual last-backup/status/size metadata and allow authorized backup jobs. Keep arbitrary SQL, database editing, destructive restore, and secret access outside the normal console.

## A19 — Feature flags

Server-enforced feature availability, gradual rollout, cohorts, change history, rollback, and kill switches. Flags never bypass authorization or falsely imply an unfinished feature works.

## A20 — Console shell and admin profile

Dedicated sidebar/dashboard layout, permission-filtered navigation, profile/MFA/session controls, logout, searchable paginated tables, accessible dialogs, loading/empty/error states, and responsive views.

## Console architecture — proposed

```text
Separate console layout and privileged auth state
       | authenticated HTTP / authorized socket subscriptions
Console routes → session + permission + validation middleware
       | service methods shared with user-facing flows where appropriate
Users / rooms / moderation / reports / settings / operations services
       | database transactions + append-only audit records
PostgreSQL / durable jobs / measured service health
```

Add frontend `console/` modules and backend `routes/console/`, authorization middleware, and focused services as features are implemented. Keep user-facing and console entry points separate while reusing business rules. Proposed API namespace: `/api/ops/lantern-7c42`; it has the same discoverability limitations and independent permission checks as the UI. Do not attach privileged handlers to the current public diagnostic socket channel without authentication.

Use transactions for role/restriction/settings changes and associated durable audit records. Background operations return job IDs and expose authorized progress. Avoid arbitrary shell/SQL execution from dashboard forms. Counts and health displays must come from real measurements, with timestamp and unavailable/stale states.

## Data and retention — proposed

Plan platform role/permission assignments, privileged sessions/MFA credentials, reports/evidence references, restrictions/appeals, audit events, setting revisions, announcement jobs/receipts, security events, feature-flag revisions, maintenance state, and backup-job metadata. Integrate with planned users, room bans, notifications, sessions, and metrics rather than creating duplicate stores. Secrets and recovery codes require suitable protected storage; never include them in audit payloads.

Restrict audit writes through database permissions; append-only application behavior is not a claim that a database operator cannot alter records. Define retention, export access, and a separate retention process. Restrict evidence/private content and avoid retaining deleted content indefinitely by accident.

## Acceptance checks

- Anonymous and ordinary accounts cannot read or mutate console data by direct HTTP/socket calls.
- Room hosts cannot become platform moderators/admins or access platform data.
- Each role is tested for allowed and denied actions, target scope, and self-escalation.
- Revoked/expired sessions and changed roles lose access promptly, including connected sockets.
- MFA/login limits, CSRF defenses, idle timeout, and step-up flows are tested.
- Every sensitive mutation produces a durable, redacted audit record; sensitive reads are recorded where required.
- Restriction expiry, report transitions, last-super-admin protection, and retry deduplication work under concurrency.
- Maintenance preserves authorized operator recovery without giving ordinary users a bypass.
- Notifications show a concrete preview; bulk/destructive changes require deliberate confirmation.
- Health/analytics never display fake success or leak credentials; backup recovery is tested separately from backup creation.

All implementation remains unchecked in [TODO.md](TODO.md). No admin accounts, announcements, database jobs, or route changes were created by this planning update.
