import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSessionCookieOptions } from '../src/utils/sessions';

test('remember me opts into a persistent cookie; unchecked uses a session cookie', () => {
  assert.equal(getSessionCookieOptions(false).maxAge, undefined);
  assert.equal(getSessionCookieOptions().maxAge, undefined);
  assert.equal(getSessionCookieOptions(true).maxAge, 30 * 24 * 60 * 60 * 1000);
  for (const rememberMe of [false, true]) {
    const options = getSessionCookieOptions(rememberMe);
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
  }
});
