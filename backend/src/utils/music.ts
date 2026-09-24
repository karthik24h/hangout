import crypto from 'node:crypto';
import { pool } from '../config/database';
import { validateSession } from './sessions';
import { AppError } from './errors';
import {
  musicPosition,
  type MusicCommand,
  type MusicReply,
  type MusicState,
} from '../../../shared/music';

export async function roomMusic(
  token: string,
  code: string,
  command?: MusicCommand,
  revision?: number
): Promise<MusicReply> {
  const session = await validateSession(token);
  if (!session) throw AppError.unauthorized('Your session expired. Please log in again.');
  if (typeof code !== 'string' || !/^[A-Z0-9]{6}$/.test(code))
    throw AppError.badRequest('Invalid room code');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT r.id, r.host_id FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE r.room_code=$1 AND r.type='music' AND r.status='active' AND m.user_id=$2 AND m.left_at IS NULL FOR UPDATE OF r`,
      [code, session.userId]
    );
    const room = result.rows[0];
    if (!room) throw AppError.forbidden('This room is closed or you are no longer a member.');
    const host = String(room.host_id) === String(session.userId);
    await client.query('INSERT INTO room_playback (room_id) VALUES ($1) ON CONFLICT DO NOTHING', [
      room.id,
    ]);
    const stored = await client.query('SELECT music_state FROM room_playback WHERE room_id=$1', [
      room.id,
    ]);
    const now = Date.now();
    const state: MusicState = stored.rows[0].music_state || {
      tracks: [],
      activeId: null,
      paused: true,
      position: 0,
      updatedAt: now,
      revision: 0,
    };
    if (command) {
      if (!host) throw AppError.forbidden('Only the host can change the shared queue or playback.');
      if (revision !== state.revision)
        throw AppError.conflict('Playback changed. Please try again.');
      state.position = musicPosition(state, now);
      if (command.type === 'add') {
        if (
          typeof command.url !== 'string' ||
          command.url.length > 2048 ||
          typeof command.title !== 'string' ||
          !command.title.trim() ||
          command.title.length > 200 ||
          state.tracks.length >= 100
        )
          throw AppError.badRequest('Provide a title and an audio URL. Queue limit is 100 tracks.');
        let url: URL;
        try {
          url = new URL(command.url);
        } catch {
          throw AppError.badRequest('Invalid audio URL');
        }
        if (url.protocol !== 'https:' || url.username || url.password)
          throw AppError.badRequest('Use a public HTTPS audio URL without credentials.');
        const track = { id: crypto.randomUUID(), title: command.title.trim(), url: url.href };
        state.tracks.push(track);
        if (!state.activeId) state.activeId = track.id;
      } else if (command.type === 'remove' || command.type === 'select') {
        if (!state.tracks.some(track => track.id === command.id))
          throw AppError.badRequest('Track not found');
        if (command.type === 'remove')
          state.tracks = state.tracks.filter(track => track.id !== command.id);
        if (command.type === 'select' || state.activeId === command.id) {
          state.activeId = command.type === 'select' ? command.id : state.tracks[0]?.id || null;
          state.position = 0;
          state.paused = true;
        }
      } else if (['play', 'pause', 'seek'].includes(command.type)) {
        if (
          !state.activeId ||
          !('position' in command) ||
          !Number.isFinite(command.position) ||
          command.position < 0 ||
          command.position > 86400
        )
          throw AppError.badRequest('Invalid playback position');
        state.position = command.position;
        if (command.type !== 'seek') state.paused = command.type === 'pause';
      } else throw AppError.badRequest('Unknown playback command');
      state.updatedAt = now;
      state.revision++;
      await client.query('UPDATE room_playback SET music_state=$2 WHERE room_id=$1', [
        room.id,
        JSON.stringify(state),
      ]);
    }
    await client.query('COMMIT');
    return { ok: true, state, host, serverTime: Date.now() };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
