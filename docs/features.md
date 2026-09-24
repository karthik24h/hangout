# Expanded feature roadmap

This document incorporates the additional 30-part feature proposal. **All features below are planned enhancements, not completed implementations.** Existing Socket.IO diagnostics and sample players do not complete chat, presence, or shared playback. Track implementation in [TODO.md](TODO.md).

## Product direction

Hangout is a private digital room where friends watch, listen, and talk together. Keep the first release focused on a reliable room engine before adding optional experiences. “Premium” describes the intended quality; billing or paid tiers have not been specified.

## Delivery priorities

| Stage | Scope | Entry requirement |
| --- | --- | --- |
| Foundation | Sessions, schema migrations, membership, authorization, validation | Current TypeScript foundation |
| First room release | Shared playback, live chat, presence, queue, reactions, room UI, invites/QR, host controls | Secure room engine and integration tests |
| Next experience release | Voice, scheduling, notifications, search, themes, dashboard, continuation, history/memories | Reliable first release and persistence |
| Later optional work | Advanced analytics, AI, richer captures and provider integrations | Privacy choices, capacity/cost evaluation, and explicit acceptance criteria |

Overlapping features extend the existing roadmap; they are not separate implementations of the same chat/queue/room system.

## F01 — Cinematic room experience

**Scope:** Theater/full-screen mode, picture-in-picture where supported, dark player surroundings, artwork-based ambient backgrounds, media transitions, Now Playing animation, title/host/avatar overlays, collapsible chat/people panels, and keyboard shortcuts.

**Dependencies and acceptance:** Room UI and media controls; provide accessible controls and reduced-motion alternatives.

## F02 — Authoritative playback synchronization

**Scope:** Shared play, pause, seek, position, playback rate, media switching, queue state, late-join recovery, and reconnection recovery.

**Dependencies and acceptance:** Server-owned playback state, clock-offset estimation, revisions, and drift measurements. Set and test a synchronization tolerance; do not promise perfect synchronization.

## F03 — Social presence

**Scope:** Online/away/watching/listening/typing states, join and action notices, avatar stacks, participant panels, and host/moderator badges.

**Dependencies and acceptance:** Authenticated membership, multi-tab-aware presence, and privacy preferences.

## F04 — Floating reactions

**Scope:** Floating emoji over the player without filling chat history.

**Dependencies and acceptance:** Membership checks, bounded event rates, user opt-out, and reduced-motion presentation.

## F05 — Optional voice rooms

**Scope:** Mute/unmute, push-to-talk, speaking indicators, per-user volume, host mute, leave voice, and voice-only rooms.

**Dependencies and acceptance:** Separate voice transport/provider evaluation, microphone permission, participant authorization, and reconnect handling. Host mute must never remotely enable a microphone.

## F06 — Advanced chat

**Scope:** Message reactions, replies, mentions, GIFs/stickers, edit/delete, pinned messages, chat search, slow mode, and host/moderator controls.

**Dependencies and acceptance:** Persistent chat, author/moderator permissions, edit history policy, provider choices, and abuse limits.

## F07 — Collaborative media queue

**Scope:** Add/remove/reorder, suggestions, voting, skip voting, saved queues, repeat, and shuffle.

**Dependencies and acceptance:** Atomic queue updates and server-defined voting eligibility, threshold, tie, and membership-change rules.

## F08 — Watch-party polls

**Scope:** Vote on the next movie or activity, such as continuing, trailers, music, or a break.

**Dependencies and acceptance:** One eligible vote per account per poll, server deadlines, result visibility, and a defined close/tie policy.

## F09 — Rich invitations

**Scope:** Invite landing page with room/host information, copy link, QR code, native share fallback, expiration, password protection, single-use links, and invite permissions.

**Dependencies and acceptance:** Server-validated invite tokens, atomic redemption, revocation, and minimal pre-join disclosure.

## F10 — Room privacy and controls

**Scope:** Public/private/password-protected/invite-only rooms, approval to join, room lock, and host toggles for playback, adding media, chat, reactions, voice, and downloads.

**Dependencies and acceptance:** Central room policy checked by HTTP and socket handlers. A download toggle controls app-provided actions; it cannot prevent capture of externally accessible media.

## F11 — Host, moderator, member, and guest roles

**Scope:** Remove/ban members, mute chat, delete messages, change permissions, transfer ownership, lock/end rooms, and control playback.

**Dependencies and acceptance:** Explicit server permission matrix. Guest identity and access policy must be designed before enabling guests; guests are not an authentication bypass.

## F12 — Mobile-first room experience

**Scope:** Player-first layout, reachable reaction controls, tabbed chat/people/queue panels, and compact bottom navigation.

**Dependencies and acceptance:** Responsive layout, touch targets, keyboard/screen-reader checks, orientation and browser capability checks.

## F13 — Multi-device continuation

**Scope:** See own active devices and explicitly continue playback on a laptop, phone, tablet, or supported TV browser.

**Dependencies and acceptance:** Account-scoped device sessions, handoff authorization, revocation, and a policy for multiple active controllers.

## F14 — Personal dashboard

**Scope:** Continue watching, recently watched/listened, favorites, saved queues, joined rooms, and created rooms.

**Dependencies and acceptance:** Private per-user history, persisted progress, and a defined resume-versus-current-room-state policy.

## F15 — Global search

**Scope:** Search authorized rooms, supported media, people, and personal history.

**Dependencies and acceptance:** Access filtering, privacy preferences, pagination, indexing, and supported media catalog/provider scope.

## F16 — Notification center

**Scope:** Invitations, joins, upcoming rooms, replies, and mentions with unread/read state.

**Dependencies and acceptance:** User preferences, deduplication, delivery channels, and membership-aware visibility.

## F17 — Scheduled rooms

**Scope:** Choose date/time and media, invite participants, show upcoming events, and request reminders.

**Dependencies and acceptance:** Store an instant plus the chosen time zone; use a durable job worker and idempotent reminder delivery.

## F18 — Recurring rooms

**Scope:** Weekly or other repeating room schedules with next-occurrence display.

**Dependencies and acceptance:** Recurrence/time-zone rules, daylight-saving behavior, cancellation, and edit-one-versus-series handling.

## F19 — Optional room analytics

**Scope:** Peak viewers, average session duration, message/reaction counts, songs played, and optionally participant activity.

**Dependencies and acceptance:** Define metrics, access restrictions, retention, and consent/opt-out. Avoid public activity rankings by default.

## F20 — Themes and personalization

**Scope:** Dark, midnight, AMOLED, light, accent selection, cinema defaults, animated backgrounds, and artwork blur.

**Dependencies and acceptance:** Persisted preferences, contrast validation, system theme support, and reduced-motion settings.

## F21 — Micro-animations

**Scope:** Page/dialog transitions, hover, presence, messages, reactions, queue reorder, media changes, skeletons, toasts, and connection transitions.

**Dependencies and acceptance:** Performance budget and reduced-motion alternatives; animation must not delay controls.

## F22 — Connection quality

**Scope:** Show connected/reconnecting/offline state, measured latency, playback drift, and actual serving region when known.

**Dependencies and acceptance:** Existing connection status is only the foundation. Quality labels require measured thresholds; never fabricate latency or region.

## F23 — Room diagnostics

**Scope:** Host view of server, database readiness, socket, media, sync health, latency, and connected users.

**Dependencies and acceptance:** Separate readiness from liveness and client media failures. Expose only authorized, sanitized diagnostics; never credentials or infrastructure internals.

## F24 — Media chapters

**Scope:** Display chapter titles/timestamps and synchronize chapter jumps.

**Dependencies and acceptance:** Supported metadata/manual chapter source and the same playback authorization used for seeking.

## F25 — Shared notes

**Scope:** Room notes linked to a media item and timestamp, with author and jump-to-time action.

**Dependencies and acceptance:** Persistent notes, edit/delete permissions, and host-controlled shared seeking.

## F26 — Saved moments and screenshots

**Scope:** Save a timestamp, caption, and optional screenshot, then browse room highlights.

**Dependencies and acceptance:** Bookmarks work independently of capture. Screenshots depend on source permissions/browser capabilities; provide a timestamp-only fallback.

## F27 — Room memories

**Scope:** After-session summary with participants, duration, counts, highlights, and Save Session.

**Dependencies and acceptance:** Retention-aware snapshots, member visibility, deletion controls, and privacy-safe handling of removed accounts/messages.

## F28 — Optional AI assistance

**Scope:** Opt-in room summaries, catch-up chat summaries, and group recommendations.

**Dependencies and acceptance:** Provider/cost evaluation, explicit data-sharing choice, authorized content only, redaction, and deletion policy. Label generated output and avoid invented source facts.

## F29 — Privacy controls

**Scope:** Hide online/last-seen status, control invitations/friend requests, choose recent-history visibility, and opt into activity sharing.

**Dependencies and acceptance:** Private watch/listen history by default. Enforce preferences in APIs, search, presence, analytics, and summaries, not only UI.

## F30 — Recovery and error UX

**Scope:** Offline detection, automatic reconnect, session recovery, skeletons, empty states, friendly errors, retry/back actions, confirmation dialogs, and unsaved-change warnings.

**Dependencies and acceptance:** Preserve drafts when possible, make retries idempotent, and do not claim data is saved until persistence is confirmed.

## Shared completion gate

A feature is complete only when its relevant UI, persistence, server authorization, runtime validation, error/reconnect behavior, accessibility, and tests are implemented. Verify room isolation with separate accounts. Update schema/API/socket contracts with code. Browser-dependent functions must show a usable fallback. Record test evidence before checking a feature off.
