import assert from 'node:assert/strict';
import { test, before, after, describe } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { io as connect } from 'socket.io-client';
import { readEnv } from '../src/config/env';
import { pool } from '../src/config/database';
import { attachSocketServer } from '../src/websocket';
import { hashToken, createSession, revokeAllUserSessions } from '../src/utils/sessions';
import bcrypt from 'bcrypt';

// The pool is initialized during imports. Never change DATABASE_URL afterwards.
// Run this suite with DATABASE_URL pointing to a disposable *_test database.
let cleanupAllowed = false;

interface TestServer {
  url: string;
  server: ReturnType<typeof createServer>;
  io: ReturnType<typeof attachSocketServer>;
}

async function createTestServer(): Promise<TestServer> {
  const { createApp } = await import('../src/app');
  const server = createServer(createApp());
  const io = attachSocketServer(server, 'http://localhost:3000');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, server, io };
}

async function cleanupTestData() {
  await pool.query('DELETE FROM sessions');
  await pool.query('DELETE FROM password_reset_tokens');
  await pool.query('DELETE FROM room_members');
  await pool.query('DELETE FROM rooms');
  await pool.query('DELETE FROM users');
}

let testServer: TestServer;

before(async () => {
  const connectionString = pool.options.connectionString;
  const databaseName = connectionString
    ? decodeURIComponent(new URL(connectionString).pathname.slice(1))
    : '';
  assert.match(
    databaseName,
    /_test$/,
    'Refusing destructive auth tests: DATABASE_URL must point to a disposable database ending in _test'
  );
  cleanupAllowed = true;
  await cleanupTestData();
  testServer = await createTestServer();
});

after(async () => {
  try {
    if (cleanupAllowed) await cleanupTestData();
  } finally {
    if (testServer) {
      await new Promise<void>(resolve => testServer.io.close(() => resolve()));
      testServer.server.close();
    }
    await pool.end();
  }
});

async function makeRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${testServer.url}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}

async function getCookie(res: Response, name: string): Promise<string | null> {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

describe('Authentication', () => {
  test('signup creates user and returns session cookie', async () => {
    const res = await makeRequest('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.user.id);
    assert.equal(data.user.email, 'test@example.com');
    const cookie = await getCookie(res, 'hangout_session');
    assert.ok(cookie);
  });

  test('signup rejects duplicate email', async () => {
    const res = await makeRequest('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Another User', email: 'test@example.com', password: 'password123' }),
    });
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.code, 'CONFLICT');
  });

  test('signup validates required fields', async () => {
    const res = await makeRequest('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid', password: 'short' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'Validation failed');
    assert.ok(Array.isArray(data.details));
  });

  test('signup validates email format', async () => {
    const res = await makeRequest('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'not-an-email', password: 'password123' }),
    });
    assert.equal(res.status, 400);
  });

  test('signup validates password length', async () => {
    const res = await makeRequest('/api/signup', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test2@example.com', password: 'short' }),
    });
    assert.equal(res.status, 400);
  });

  test('login succeeds with correct credentials', async () => {
    const res = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.user.id);
    const cookie = await getCookie(res, 'hangout_session');
    assert.ok(cookie);
  });

  test('login fails with wrong password', async () => {
    const res = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Invalid credentials');
  });

  test('login fails with non-existent email', async () => {
    const res = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' }),
    });
    assert.equal(res.status, 401);
  });

  test('login validates required fields', async () => {
    const res = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    assert.equal(res.status, 400);
  });

  test('/api/me returns user when authenticated', async () => {
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    const cookie = await getCookie(loginRes, 'hangout_session');
    
    const res = await makeRequest('/api/me', {
      headers: { Cookie: `hangout_session=${cookie}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, 'test@example.com');
  });

  test('/api/me returns 401 without session', async () => {
    const res = await makeRequest('/api/me');
    assert.equal(res.status, 401);
  });

  test('/api/me returns 401 with invalid session', async () => {
    const res = await makeRequest('/api/me', {
      headers: { Cookie: 'hangout_session=invalidtoken' },
    });
    assert.equal(res.status, 401);
  });

  test('logout revokes session and clears cookie', async () => {
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    const cookie = await getCookie(loginRes, 'hangout_session');
    
    const res = await makeRequest('/api/logout', {
      method: 'POST',
      headers: { Cookie: `hangout_session=${cookie}` },
    });
    assert.equal(res.status, 200);
    
    // Verify session is revoked
    const meRes = await makeRequest('/api/me', {
      headers: { Cookie: `hangout_session=${cookie}` },
    });
    assert.equal(meRes.status, 401);
  });

  test('password reset request generates token', async () => {
    const res = await makeRequest('/api/reset-password/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.resetToken);
    assert.ok(data.resetUrl);
  });

  test('password reset request does not reveal if email exists', async () => {
    const res = await makeRequest('/api/reset-password/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.message, 'If the email exists, a reset link has been sent');
  });

  test('password reset confirm updates password', async () => {
    const requestRes = await makeRequest('/api/reset-password/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const requestData = await requestRes.json();
    const token = requestData.resetToken;
    
    const res = await makeRequest('/api/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'newpassword123' }),
    });
    assert.equal(res.status, 200);
    
    // Verify new password works
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'newpassword123' }),
    });
    assert.equal(loginRes.status, 200);
  });

  test('password reset confirm rejects invalid token', async () => {
    const res = await makeRequest('/api/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token', password: 'newpassword123' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 'BAD_REQUEST');
  });

  test('password reset token can only be used once', async () => {
    const requestRes = await makeRequest('/api/reset-password/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const requestData = await requestRes.json();
    const token = requestData.resetToken;
    
    // First use
    await makeRequest('/api/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'password123' }),
    });
    
    // Second use should fail
    const res = await makeRequest('/api/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'password456' }),
    });
    assert.equal(res.status, 400);
  });

  test('password reset revokes all existing sessions', async () => {
    // Login to create session
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    const cookie = await getCookie(loginRes, 'hangout_session');
    
    // Request reset
    const requestRes = await makeRequest('/api/reset-password/request', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const requestData = await requestRes.json();
    const token = requestData.resetToken;
    
    // Confirm reset
    await makeRequest('/api/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'newpassword123' }),
    });
    
    // Old session should be revoked
    const meRes = await makeRequest('/api/me', {
      headers: { Cookie: `hangout_session=${cookie}` },
    });
    assert.equal(meRes.status, 401);
  });

  test('expired session is rejected', async () => {
    // Create a session directly in database with past expiry
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    const userId = userResult.rows[0].id;
    
    const expiredToken = 'expired-test-token';
    const expiredTokenHash = hashToken(expiredToken);
    const expiredAt = new Date(Date.now() - 1000); // 1 second ago
    
    await pool.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, expiredTokenHash, expiredAt]
    );
    
    const res = await makeRequest('/api/me', {
      headers: { Cookie: `hangout_session=${expiredToken}` },
    });
    assert.equal(res.status, 401);
  });

  test('revoked session is rejected', async () => {
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'newpassword123' }),
    });
    const cookie = await getCookie(loginRes, 'hangout_session');
    assert.ok(cookie);
    
    // Manually revoke the session
    const tokenHash = hashToken(cookie!);
    await pool.query('UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
    
    const res = await makeRequest('/api/me', {
      headers: { Cookie: `hangout_session=${cookie}` },
    });
    assert.equal(res.status, 401);
  });

  test('CSRF token required for state-changing requests', async () => {
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'newpassword123' }),
    });
    const cookie = await getCookie(loginRes, 'hangout_session');
    
    // Try to access protected route without CSRF token
    const res = await makeRequest('/api/rooms/create', {
      method: 'POST',
      headers: { Cookie: `hangout_session=${cookie}` },
      body: JSON.stringify({ type: 'video', privacy: 'public' }),
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error, 'Invalid CSRF token');
  });

  test('CSRF token endpoint returns token for authenticated user', async () => {
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'newpassword123' }),
    });
    const cookie = await getCookie(loginRes, 'hangout_session');
    
    const res = await makeRequest('/api/csrf-token', {
      headers: { Cookie: `hangout_session=${cookie}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.csrfToken);
  });
});