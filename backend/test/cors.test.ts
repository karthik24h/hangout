import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { io as connect } from 'socket.io-client';
import { readEnv } from '../src/config/env';

test('additional origins are optional and normalized', () => {
  const source = { DATABASE_URL: 'postgresql://localhost/hangout' };
  assert.deepEqual(readEnv(source).frontendOrigins, ['http://localhost:3000']);
  assert.deepEqual(
    readEnv({
      ...source,
      ADDITIONAL_FRONTEND_ORIGINS: ' http://localhost:3001/, ,http://localhost:3000 ',
    }).frontendOrigins,
    ['http://localhost:3000', 'http://localhost:3001']
  );
});

test('configuration rejects unsafe or malformed browser origins', () => {
  for (const origin of [
    '*',
    'null',
    'file:///tmp',
    'ftp://example.com',
    'https://user:pass@example.com',
    'https://example.com/path',
    'https://example.com?q=1',
    'https://example.com/#fragment',
  ]) {
    for (const setting of ['FRONTEND_URL', 'ADDITIONAL_FRONTEND_ORIGINS']) {
      assert.throws(
        () =>
          readEnv({
            DATABASE_URL: 'postgresql://localhost/hangout',
            [setting]: origin,
          }),
        /must contain HTTP/
      );
    }
  }
});

test(
  'API and sockets allow configured origins and reject other origins',
  { timeout: 10000 },
  async () => {
    process.env.DATABASE_URL = 'postgresql://localhost/hangout';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.ADDITIONAL_FRONTEND_ORIGINS = 'http://localhost:3001';
    const { createApp } = await import('../src/app');
    const { attachSocketServer } = await import('../src/websocket');
    const server = createServer(createApp());
    const sockets = attachSocketServer(server, readEnv().frontendOrigins);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      assert.equal((await fetch(`${url}/health`)).status, 200);
      for (const origin of [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://untrusted.example',
        'http://localhost:3001.evil.example',
        'null',
      ]) {
        const allowed = readEnv().frontendOrigins.includes(origin);
        const response = await fetch(`${url}/api/login`, {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type,x-csrf-token',
          },
        });
        assert.equal(response.headers.get('access-control-allow-origin'), allowed ? origin : null);
        assert.equal(response.status, allowed ? 204 : 403);
        if (allowed) {
          assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
          assert.match(response.headers.get('access-control-allow-headers')!, /X-CSRF-Token/i);
          assert.equal(response.headers.get('access-control-max-age'), '600');
          assert.match(response.headers.get('vary')!, /Origin/);
          assert.equal(response.headers.get('ratelimit-remaining'), null);
        }
        const actual = await fetch(`${url}/health`, { headers: { Origin: origin } });
        assert.equal(actual.status, allowed ? 200 : 403);
        const client = connect(url, {
          autoConnect: false,
          reconnection: false,
          transports: ['websocket'],
          extraHeaders: { Origin: origin },
        });
        try {
          const result = new Promise<string>(resolve => {
            client.once('connect', () => resolve('connected'));
            client.once('connect_error', error => resolve(error.message));
          });
          client.connect();
          assert.equal(await result, allowed ? 'connected' : 'Origin not allowed');
        } finally {
          client.disconnect();
        }
      }
    } finally {
      await new Promise<void>(resolve => sockets.close(() => resolve()));
    }
  }
);
