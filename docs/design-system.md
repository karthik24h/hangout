# Design system — planned

Existing CSS was moved to `frontend/src/styles` without a visual redesign. The following is the target, not a claim of implemented UI.

## Tokens

| Purpose | Proposed value |
| --- | --- |
| Page / panel / card | #0B0D12 / #11141B / #181C24 |
| Border | #262B35 |
| Primary / secondary text | #F5F7FA / #9CA3AF |
| Accent | #7C5CFC |
| Success / warning / danger | #22C55E / #F59E0B / #EF4444 |

Use a system font stack, spacing of 4/8/12/16/24/32px, and radii of 6/10/16px. Verify contrast in actual combinations. Extract tokens, global styles, layouts, components, and responsive rules incrementally.

## Components and screens

Build consistent primary/secondary/ghost/danger buttons, labeled inputs, cards, accessible modals, avatars, badges, dropdowns, confirmations, toasts, skeletons, empty states, and error/retry states.

The desktop app shell includes a header and sidebar. Home shows real rooms and create/join actions. Room UI centers the player with People/Chat/Queue panels, host controls, and connection status. Mobile stacks the player above tabs and compact navigation. Profile, settings, favorites, notifications, and history must use real persisted data.

Dialogs need focus management, Escape support, and focus restoration. Provide visible keyboard focus, reduced-motion behavior, responsive layouts, and accessible announcements. Avoid fake participant counts or fabricated activity. Preserve drafts on failure and prevent duplicate submissions. Dark/light/system appearance and keyboard shortcuts remain future work.

## Expanded experience patterns — planned

See [features F01–F30](features.md). Add theater/PiP controls with support-aware fallback; artwork ambience; title/host/avatar overlays; collapsible chat/people panels; mobile reaction controls; voice mute/push-to-talk/speaking states; and a clear queue/poll voting UI.

Plan invitation previews/QR, approval and permission dialogs, scheduling with explicit time zones, recurrence editing, device continuation, notification center, dashboard/search, chapters, notes, moments, and session memories. Distinguish public room metadata from information visible only to members.

Themes include dark/midnight/AMOLED/light and accents after contrast checks. Motion covers messages, presence, reactions, queue reorder, and media transitions with reduced-motion alternatives. Diagnostics must show measured values, unavailable states, and honest persistence/recovery feedback. Provide private-history defaults, explicit voice/AI opt-in, and drafts/unsaved-change handling.
