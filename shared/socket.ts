// Only connection diagnostics are implemented. Room events require real authentication first.
export interface ServerToClientEvents {
  'server:ready': (data: { protocolVersion: 1 }) => void;
}
export interface ClientToServerEvents {
  'health:ping': (reply: (data: { ok: true }) => void) => void;
}
