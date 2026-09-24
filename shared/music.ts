export interface SharedTrack {
  id: string;
  title: string;
  url: string;
}
export interface MusicState {
  tracks: SharedTrack[];
  activeId: string | null;
  paused: boolean;
  position: number;
  updatedAt: number;
  revision: number;
}
export type MusicCommand =
  | { type: "add"; title: string; url: string }
  | { type: "remove" | "select"; id: string }
  | { type: "play" | "pause" | "seek"; position: number };
export type MusicReply =
  | { ok: true; state: MusicState; host: boolean; serverTime: number }
  | { ok: false; error: string };
export function musicPosition(state: MusicState, serverTime: number) {
  return Math.max(
    0,
    state.position +
      (state.paused ? 0 : Math.max(0, serverTime - state.updatedAt) / 1000),
  );
}
