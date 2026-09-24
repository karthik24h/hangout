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
