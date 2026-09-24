import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { io } from 'socket.io-client';
import { pool } from '../src/config/database';
import { createSession, revokeSession } from '../src/utils/sessions';
import { attachSocketServer } from '../src/websocket';
import type { MusicReply, MusicCommand } from '../../shared/music';

test('two clients share persisted music state and enforce host, membership, revisions and revocation', async () => {
  const users: number[] = [];
  let roomId: number | undefined;
  const http = createServer();
  const server = attachSocketServer(http, 'http://localhost:3000');
  const sockets: ReturnType<typeof io>[] = [];
  try {
    const tag = crypto.randomUUID();
    for (const role of ['host', 'guest', 'outsider']) {
      const result = await pool.query(
        'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id',
        [role, `${role}-${tag}@test.invalid`, 'not-a-login-hash']
      );
      users.push(result.rows[0].id);
    }
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    roomId = (
      await pool.query(
        "INSERT INTO rooms(room_code,name,type,host_id,privacy) VALUES($1,'sync test','music',$2,'public') RETURNING id",
        [code, users[0]]
      )
    ).rows[0].id;
    for (const [index, id] of users.slice(0, 2).entries())
      await pool.query('INSERT INTO room_members(room_id,user_id,role) VALUES($1,$2,$3)', [
        roomId,
        id,
        index ? 'member' : 'host',
      ]);
    http.listen(0, '127.0.0.1');
    await once(http, 'listening');
    const tokens = await Promise.all(users.map(id => createSession(id)));
    for (const token of tokens) {
      const socket = io(`http://127.0.0.1:${(http.address() as AddressInfo).port}`, {
        extraHeaders: { Cookie: `hangout_session=${token}` },
        transports: ['websocket'],
      });
      sockets.push(socket);
      await once(socket, 'connect');
    }
    async function request(
      index: number,
      command?: MusicCommand,
      revision?: number
    ): Promise<MusicReply> {
      await new Promise(resolve => setTimeout(resolve, 110));
      return sockets[index].timeout(3000).emitWithAck('music:request', { code, command, revision });
    }
    const initial = await request(0);
    assert.ok(initial.ok);
    assert.equal(initial.host, true);
    const added = await request(
      0,
      { type: 'add', title: 'Shared track', url: 'https://example.com/audio.mp3' },
      0
    );
    assert.ok(added.ok);
    assert.equal(added.state.tracks.length, 1);
    const guest = await request(1);
    assert.ok(guest.ok);
    assert.deepEqual(guest.state, added.state);
    assert.equal(guest.host, false);
    assert.equal((await request(1, { type: 'play', position: 0 }, 1)).ok, false);
    assert.equal((await request(2)).ok, false);
    const play = await request(0, { type: 'play', position: 12 }, 1);
    assert.ok(play.ok);
    assert.equal(play.state.paused, false);
    const listener = await request(1);
    assert.ok(listener.ok);
    assert.equal(listener.state.position, 12);
    assert.equal((await request(0, { type: 'pause', position: 12 }, 1)).ok, false);
    const paused = await request(0, { type: 'pause', position: 15 }, 2);
    assert.ok(paused.ok);
    assert.equal(paused.state.paused, true);
    sockets[1].disconnect();
    sockets[1].connect();
    await once(sockets[1], 'connect');
    const rejoined = await request(1);
    assert.ok(rejoined.ok);
    assert.equal(rejoined.state.position, 15);
    await revokeSession(tokens[1]);
    assert.equal((await request(1)).ok, false);
    await pool.query("UPDATE rooms SET status='closed' WHERE id=$1", [roomId]);
    assert.equal((await request(0)).ok, false);
  } finally {
    sockets.forEach(socket => socket.disconnect());
    await new Promise<void>(resolve => server.close(() => resolve()));
    if (roomId) await pool.query('DELETE FROM rooms WHERE id=$1', [roomId]);
    if (users.length) await pool.query('DELETE FROM users WHERE id=ANY($1::bigint[])', [users]);
    await pool.end();
  }
});
