// Only connection diagnostics are implemented. Room events require real authentication first.
export interface ServerToClientEvents {
  'server:ready': (data: { protocolVersion: 1 }) => void;
  'auth:validated': (data: { ok: true; user: { id: number; name: string; email: string } }) => void;
  'auth:error': (data: { ok: false; error: string }) => void;
}
export interface ClientToServerEvents {
  'health:ping': (reply: (data: { ok: true }) => void) => void;
  'auth:validate': (reply: (data: { ok: true; user: { id: number; name: string; email: string } } | { ok: false; error: string }) => void) => void;
  'auth:logout': (reply: (data: { ok: true }) => void) => void;
}