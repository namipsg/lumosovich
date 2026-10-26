import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createAuthenticationMethods } from '../dist/authentication.js';
import { TmdbHttpClient } from '../dist/http.js';
import { TmdbError } from '../dist/errors.js';

const spec = JSON.parse(fs.readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url)));
function example(operationId) {
  for (const operations of Object.values(spec.paths)) {
    for (const operation of Object.values(operations)) {
      if (operation.operationId === operationId) {
        return JSON.parse(operation.responses['200'].content['application/json'].examples.Result.value);
      }
    }
  }
  throw new Error(`Missing pinned operation ${operationId}`);
}
const login = { username: 'private-user', password: 'private-password', requestToken: 'private-token' };
const operations = [
  ['validateKey', [], 'authentication-validate-key', 'GET', 'authentication'],
  ['createGuestSession', [], 'authentication-create-guest-session', 'GET', 'authentication/guest_session/new'],
  ['createRequestToken', [], 'authentication-create-request-token', 'GET', 'authentication/token/new'],
  ['createSession', ['private-token'], 'authentication-create-session', 'POST', 'authentication/session/new', { request_token: 'private-token' }],
  ['createSessionFromV4Token', ['private-access-token'], 'authentication-create-session-from-v4-token', 'POST', 'authentication/session/convert/4', { access_token: 'private-access-token' }],
  ['validateRequestTokenWithLogin', [login], 'authentication-create-session-from-login', 'POST', 'authentication/token/validate_with_login', { username: login.username, password: login.password, request_token: login.requestToken }],
  ['deleteSession', ['private-session'], 'authentication-delete-session', 'DELETE', 'authentication/session', { session_id: 'private-session' }],
];
function returning(payload, bearer = false) {
  const requests = [];
  const methods = createAuthenticationMethods(new TmdbHttpClient({
    ...(bearer ? { accessToken: 'private-bearer' } : { apiKey: 'test-key' }), language: 'fa-IR',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  }));
  return { methods, requests };
}

for (const [method, args, operationId, verb, path, body] of operations) {
  test(`authentication.${method} matches pinned ${operationId} and omits language`, async () => {
    const payload = { ...example(operationId), extra: { retained: true } };
    const { methods, requests } = returning(payload);
    assert.deepEqual(await methods[method](...args), payload);
    assert.equal(requests.length, 1);
    const { url, init } = requests[0];
    assert.equal(url.pathname, `/3/${path}`);
    assert.equal(init.method ?? 'GET', verb);
    assert.deepEqual(Object.fromEntries(url.searchParams), { api_key: 'test-key' });
    assert.deepEqual(init.body === undefined ? undefined : JSON.parse(init.body), body);
    if (body) assert.equal(init.headers['content-type'], 'application/json');
    for (const secret of ['private-user', 'private-password', 'private-token', 'private-session', 'private-access-token']) {
      assert.equal(url.toString().includes(secret), false);
    }
  });
}

test('authentication accepts bearer authentication without query credentials', async () => {
  const { methods, requests } = returning(example('authentication-validate-key'), true);
  await methods.validateKey();
  assert.equal(requests[0].url.search, '');
  assert.equal(requests[0].init.headers.authorization, 'Bearer private-bearer');
});

test('authentication rejects missing and empty strings before fetching', async () => {
  const { methods, requests } = returning({});
  for (const method of ['createSession', 'createSessionFromV4Token', 'deleteSession']) {
    for (const value of [undefined, null, '', ' ', 1, true, {}, []]) {
      await assert.rejects(methods[method](value), TypeError);
    }
  }
  for (const options of [undefined, null, '', 1, [], {}]) {
    await assert.rejects(methods.validateRequestTokenWithLogin(options), TypeError);
  }
  for (const field of ['username', 'password', 'requestToken']) {
    for (const value of [undefined, null, '', ' ', 1, true, {}, []]) {
      await assert.rejects(methods.validateRequestTokenWithLogin({ ...login, [field]: value }), (error) => {
        assert.ok(error instanceof TypeError);
        assert.equal(String(error).includes('private-'), false);
        return true;
      });
    }
  }
  assert.equal(requests.length, 0);
});

test('authentication preserves supplied nonempty strings, including password whitespace', async () => {
  const { methods, requests } = returning(example('authentication-create-session-from-login'));
  const supplied = { username: ' user ', password: ' password ', requestToken: ' token ' };
  await methods.validateRequestTokenWithLogin(supplied);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    username: supplied.username, password: supplied.password, request_token: supplied.requestToken,
  });
});

test('authentication validates success, token, session, expiry and status fields with safe errors', async () => {
  for (const [method, args, operationId] of operations) {
    const pinned = example(operationId);
    const invalid = [null, [], {}, 'private upstream diagnostic',
      { ...pinned, success: undefined }, { ...pinned, success: 'true' },
      ...[0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', null].map((status_code) => ({ ...pinned, status_code })),
      { ...pinned, status_message: 123 },
    ];
    for (const field of ['request_token', 'session_id', 'guest_session_id', 'expires_at']) {
      if (field in pinned) {
        for (const value of [undefined, '', ' ', 123, null, false]) invalid.push({ ...pinned, [field]: value });
      }
    }
    for (const payload of invalid) {
      await assert.rejects(returning(payload).methods[method](...args), (error) => {
        assert.ok(error instanceof TmdbError);
        assert.equal(error.code, 'INVALID_RESPONSE');
        assert.equal(/private|test-key/.test(String(error)), false);
        return true;
      }, `${method}: ${JSON.stringify(payload)}`);
    }
  }
});

test('authentication.validateKey accepts the current live response with only success', async () => {
  const payload = { success: true };
  assert.deepEqual(await returning(payload).methods.validateKey(), payload);
});

test('authentication retains explicit false success responses and valid optional status fields', async () => {
  const payload = { success: false, status_code: 34, status_message: 'The resource could not be found.', extra: true };
  assert.deepEqual(await returning(payload).methods.deleteSession('session'), payload);
});
