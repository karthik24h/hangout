# Socket.IO and media synchronization

## Implemented foundation

The backend attaches Socket.IO to the same Node HTTP server as Express. The browser creates a typed client in `socket/client.ts`; `useConnectionStatus` connects when the header mounts and disconnects/cleans listeners on unmount.

| Direction | Event | Payload |
| --- | --- | --- |
| Server → client | `server:ready` | `{ protocolVersion: 1 }` |
| Client → server | `health:ping` | Acknowledgement callback receiving `{ ok: true }` |

These are public diagnostics only. There are no room subscriptions, private messages, or media control events yet. CORS is configured but is not authentication.

## Target flow

Validate the HTTP session during socket connection. Validate room membership before subscribing and check current permissions for every command. Persist durable changes before broadcasting. Revalidate and reload state after reconnect. Handle session expiry/revocation even for sockets that remain connected.

Proposed events: `room:join`, `room:leave`, `room:snapshot`, `room:updated`, `room:closed`, `presence:updated`, `chat:send`, `chat:message`, `chat:typing`, `media:command`, `media:state`, `queue:add`, `queue:remove`, `queue:reorder`, and `queue:updated`.

Define payload/acknowledgement types and runtime validation before wiring each event. Server identity is authoritative. Limit payloads and rates; deduplicate message retries. Presence counts unique users across tabs, and chat history requires pagination.

## Playback design — not implemented

A server snapshot should include roomCode, queueItemId, paused, positionSeconds, updatedAtServerMs, and revision. While playing, clients calculate expected position from the stored position plus elapsed server time using an estimated clock offset. While paused, position stays fixed.

Use revisions to reject stale state, bounded drift correction, and suppression of local rebroadcast when applying remote changes. Address buffering, unavailable URLs, browser autoplay restrictions, late joins, and reconnect explicitly. Socket.IO transports control data; browsers load media bytes directly.

Required future tests: two clients, room isolation, nonmember access, unauthorized playback, revoked sessions, retries, stale revisions, late joins, reconnect, and autoplay failures. Multiple backend instances additionally require shared coordination.

References: [server initialization](https://socket.io/docs/v4/server-initialization/) and [TypeScript event contracts](https://socket.io/docs/v4/typescript/).

## Expanded events — proposed only

Additional event families may include ephemeral player reactions, polls/results, richer presence/activity, moderation/policy changes, queue suggestions/skip votes, notification delivery, device handoff, and notes/moments. Establish typed payloads and acknowledgements before adding handlers. Persistent changes must use the same services as HTTP; restrict all broadcasts to authorized recipients.

Add playback rate to authoritative state; elapsed playing time must account for that rate. Chapters and timestamp notes/moments reuse authorized seek commands. Expose measured round-trip latency and drift rather than invented quality scores; calibrate labels and test reconnect behavior. A connection indicator does not establish database or media health.

Voice requires its own evaluated transport and microphone lifecycle. Socket.IO may coordinate authorized signaling, but is not a substitute for an audio transport. Host mute must not enable another user's microphone. Rate-limit reaction bursts and typing; define one-account vote eligibility and disconnect handling before queue/poll voting.

## Privileged operations events — planned

Console metrics, reports, restriction updates, and maintenance broadcasts require separate authorized subscriptions and payload scopes; the current diagnostic socket exposes none of them. Check platform permissions independently of room roles. Revocations/bans must affect active connections and commands. See [console acceptance checks](admin-console.md) for required isolation and role-change tests.
