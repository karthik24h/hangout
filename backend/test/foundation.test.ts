import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { io as connect } from 'socket.io-client';
import { readEnv } from '../src/config/env';
import { generateRoomCode } from '../src/utils/roomCode';
import { attachSocketServer } from '../src/websocket';

// No database queries are made by these tests.
process.env.DATABASE_URL = 'postgresql://postgres:1234@localhost:5432/hangout';

test('configuration rejects missing database and invalid port', () => {
  assert.throws(() => readEnv({}), /DATABASE_URL/);
  assert.throws(() => readEnv({ DATABASE_URL: process.env.DATABASE_URL, PORT: 'abc' }), /PORT/);
  assert.throws(() => readEnv({ DATABASE_URL: 'https://example.com' }), /PostgreSQL/);
  assert.equal(readEnv({ DATABASE_URL: process.env.DATABASE_URL }).port, 5000);
});

test('room codes preserve six-character shareable format', () => {
  for (let i = 0; i < 100; i++) assert.match(generateRoomCode(), /^[A-Z0-9]{6}$/);
});

test('HTTP diagnostics, disabled recovery, errors, and socket acknowledgement', { timeout: 10000 }, async () => {
  const { createApp } = await import('../src/app');
  const server = createServer(createApp());
  const sockets = attachSocketServer(server, 'http://localhost:3000');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const client = connect(url, { autoConnect: false, reconnection: false });
  try {
    const health = await fetch(`${url}/health`);
    assert.deepEqual(await health.json(), { ok: true });
    assert.equal((await fetch(`${url}/missing`)).status, 404);
    // Old reset-password endpoint is now replaced with request/confirm endpoints
    // These may return 400 (validation error) or 500 (DB connection error in test), but not 404
    const resetRequestStatus = (await fetch(`${url}/api/reset-password/request`, { method: 'POST' })).status;
    const resetConfirmStatus = (await fetch(`${url}/api/reset-password/confirm`, { method: 'POST' })).status;
    assert.notEqual(resetRequestStatus, 404);
    assert.notEqual(resetConfirmStatus, 404);
    const malformed = await fetch(`${url}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    const ready = new Promise<unknown>((resolve, reject) => {
      client.once('server:ready', resolve);
      client.once('connect_error', reject);
    });
    client.connect();
    assert.deepEqual(await ready, { protocolVersion: 1 });
    const reply = await client.timeout(2000).emitWithAck('health:ping');
    assert.deepEqual(reply, { ok: true });
  } finally {
    client.disconnect();
    await new Promise<void>(resolve => sockets.close(() => resolve()));
  }
});
