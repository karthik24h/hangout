# Implementation checklist

Reviewed 2026-09-24. `[x]` means implemented; `[ ]` means missing or unfinished. Tests and runtime verification are tracked separately. A placeholder screen does not complete its feature.

## Foundation and existing prototype

- [x] React/TypeScript frontend with strict type checking.
- [x] TypeScript Node/Express backend with build/development scripts.
- [x] Vite development server and production build configuration.
- [x] Organize frontend into app, components, pages, hooks, services, socket, and styles.
- [x] Separate backend app/startup, configuration, routes, socket layer, and utilities.
- [x] Shared typed socket event contract.
- [x] Environment-based API/socket URLs and required database connection string.
- [x] Safe example environment files and ignored local secrets/build outputs.
- [x] Signup with bcrypt and login credential comparison.
- [x] Basic PostgreSQL room create/find/delete handlers.
- [x] Sample audio/video players, room dialogs, and code copying.
- [x] Clear legacy flags on logout and guard settings in the frontend.
- [x] Disable unverified password reset until secure recovery exists.
- [x] Socket.IO server/client diagnostics with visible connection state and cleanup.
- [x] Crypto-based six-character room code generation.
- [x] HTTP health endpoint, explicit CORS origin, and JSON size limit.
- [x] Foundation tests for configuration, HTTP behavior, and socket connectivity.
- [x] README, architecture, API, database, real-time, and UI planning documents.
- [ ] Versioned database migrations and existing-data upgrade path.
- [ ] Controllers/services extraction as business rules grow.
- [ ] Comprehensive runtime request validation and consistent structured errors.
- [x] Frontend type check and production build pass.
- [x] Backend compilation and three foundation tests pass.
- [ ] Automated frontend interaction tests and consistent lint/format checks.
- [ ] Verify full account/room flows against a live PostgreSQL database.

## Authentication and security

- [ ] Persist expiring server-verified sessions and secure cookies.
- [ ] Add current-user API, AuthProvider, renewal, and server logout invalidation.
- [ ] Protect HTTP routes and authorize room ownership on the server.
- [ ] Replace the legacy localStorage authentication flag.
- [ ] Secure password recovery with single-use expiring tokens and verified email delivery.
- [ ] Database-enforced normalized email uniqueness, including concurrent signup.
- [ ] Rate limits, security headers, origin/CSRF protection, and safe structured logging.
- [ ] Socket session validation and expiry/revocation behavior.
- [ ] Tests for invalid credentials, expired sessions, recovery, logout, and denied access.

## UI and design system

- [ ] Shared design tokens; split duplicated CSS and remove unsupported utility classes.
- [ ] App shell, sidebar, header, and mobile navigation.
- [ ] Reusable buttons, labeled inputs, cards, accessible dialogs, and confirmations.
- [ ] Toasts, loading skeletons, useful empty states, and retryable errors.
- [ ] Replace demo room cards, participant counts, profile details, and chat.
- [ ] Mobile room tabs for People, Chat, and Queue.
- [ ] Keyboard access, focus management, contrast, and reduced-motion verification.
- [ ] Dark/light/system appearance and keyboard shortcuts.

## Rooms

- [ ] Persist media type, host, privacy, lifecycle, and timestamps.
- [ ] Enforce code uniqueness and retry collisions.
- [ ] Hash and enforce room passwords server-side.
- [ ] Persist membership and role-based permissions.
- [ ] Join the correct music/video room using stored type.
- [ ] Real room listing, participant list, and counts.
- [ ] Leave, host-only close, member removal, and host transfer.
- [ ] Invite links and return to invite destination after login.
- [ ] Created/active/idle/closed/expired transitions and abandoned-room cleanup.
- [ ] Tests for wrong passwords, invalid codes, unauthorized close, and host transfer.

## Real-time chat and presence

- [ ] Authorize subscriptions to Socket.IO rooms.
- [ ] Multi-tab-aware presence and participant updates.
- [ ] Persist/broadcast messages with server identity and timestamps.
- [ ] Paginated history, payload limits, rate limits, and duplicate-send protection.
- [ ] Typing indicators and unread counts.
- [ ] Reconcile room state and missed messages after reconnect.
- [ ] Room-closed notifications and rejection of further actions.
- [ ] Two-client delivery, room isolation, revoked sessions, and reconnect tests.

## Shared media

- [ ] Supported URL validation and functional Add Media dialog.
- [ ] Persistent queue with reorder, remove, skip, and clear operations.
- [ ] Host-authorized playback state with timestamp and revision.
- [ ] Synchronize play, pause, seek, and media changes.
- [ ] Late-join/reconnect position recovery and bounded drift correction.
- [ ] Autoplay, buffering, unavailable media, and feedback-loop handling.
- [ ] Two-client synchronization and stale-command tests.

## Personal and social features

- [ ] Real profile with name, avatar, bio, and activity.
- [ ] Persistent settings, verified email/password changes, and account deletion.
- [ ] Favorites: save/remove, search, filters, and add to queue.
- [ ] Notifications and invitations with read state.
- [ ] Room activity/history, recently played, and continue watching.
- [ ] Friends, reactions, replies, mentions, message editing/deletion, moderation.
- [ ] Global search and media library.
- [ ] Later: uploads, GIFs, and file sharing with storage/abuse limits.

## Production

- [ ] Resolve the two remaining moderate React Router audit findings (requires evaluating a major-version upgrade).

- [ ] CI for type checks, builds, frontend/backend/database/socket tests.
- [ ] Database readiness check, monitoring, and operational logging.
- [ ] HTTPS deployment, proxy socket configuration, and secret management.
- [ ] Verified backups/restores and migration recovery procedures.
- [ ] Privacy, retention, account deletion, media rights, and abuse-control review.
- [ ] Accessibility, mobile, multi-browser, and multi-user verification.
- [ ] Shared Socket.IO coordination before multi-instance deployment.

Update these boxes and relevant API/schema/event docs in the same change as implementation. Do not mark broad features complete until persistence, authorization, UI behavior, and applicable tests exist.

## Expanded experience checklist

See [feature scope and acceptance requirements](features.md). These items extend the phases above; none are complete merely because the foundation exists.

- [ ] F01: Cinematic room experience.
- [ ] F02: Authoritative playback synchronization.
- [ ] F03: Social presence.
- [ ] F04: Floating reactions.
- [ ] F05: Optional voice rooms.
- [ ] F06: Advanced chat.
- [ ] F07: Collaborative media queue.
- [ ] F08: Watch-party polls.
- [ ] F09: Rich invitations.
- [ ] F10: Room privacy and controls.
- [ ] F11: Host, moderator, member, and guest roles.
- [ ] F12: Mobile-first room experience.
- [ ] F13: Multi-device continuation.
- [ ] F14: Personal dashboard.
- [ ] F15: Global search.
- [ ] F16: Notification center.
- [ ] F17: Scheduled rooms.
- [ ] F18: Recurring rooms.
- [ ] F19: Optional room analytics.
- [ ] F20: Themes and personalization.
- [ ] F21: Micro-animations.
- [ ] F22: Connection quality.
- [ ] F23: Room diagnostics.
- [ ] F24: Media chapters.
- [ ] F25: Shared notes.
- [ ] F26: Saved moments and screenshots.
- [ ] F27: Room memories.
- [ ] F28: Optional AI assistance.
- [ ] F29: Privacy controls.
- [ ] F30: Recovery and error UX.
