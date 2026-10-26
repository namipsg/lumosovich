import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createAccountMutationMethods } from '../dist/account-mutations.js';
import { TmdbHttpClient } from '../dist/http.js';
import { TmdbError } from '../dist/errors.js';

const spec = JSON.parse(fs.readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url)));
const operations = [
  ['setFavorite', 'favorite', 'account-add-favorite'],
  ['setWatchlist', 'watchlist', 'account-add-to-watchlist'],
];
const session = { sessionId: 'private-session' };
function operation(field) {
  return spec.paths[`/3/account/{account_id}/${field}`].post;
}
function example(field) {
  return JSON.parse(operation(field).responses['200'].content['application/json'].examples.Result.value);
}
function returning(payload, auth = { apiKey: 'test-key' }) {
  const requests = [];
  const methods = createAccountMutationMethods(new TmdbHttpClient({
    ...auth, language: 'fa-IR',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  }));
  return { methods, requests };
}

for (const [method, field, operationId] of operations) {
  test(`accounts.${method} matches pinned ${operationId} request and response examples`, async () => {
    assert.equal(operation(field).operationId, operationId);
    const body = operation(field).requestBody.content['application/json'].examples['Request Example'].value;
    const payload = example(field);
    const { methods, requests } = returning(payload);
    assert.deepEqual(await methods[method](12, body.media_type, body.media_id, body[field], session), payload);
    assert.equal(requests.length, 1);
    const { url, init } = requests[0];
    assert.equal(url.pathname, `/3/account/12/${field}`);
    assert.deepEqual(Object.fromEntries(url.searchParams), { session_id: session.sessionId, api_key: 'test-key' });
    assert.equal(init.method, 'POST');
    assert.equal(init.headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(init.body), body);
  });

  test(`accounts.${method} supports TV removal, bearer auth and upstream extra fields`, async () => {
    const payload = { ...example(field), success: true, additional: { retained: true } };
    const { methods, requests } = returning(payload, { accessToken: 'test-token' });
    assert.deepEqual(await methods[method](12, 'tv', 1399, false, session), payload);
    assert.deepEqual(JSON.parse(requests[0].init.body), { media_type: 'tv', media_id: 1399, [field]: false });
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), { session_id: session.sessionId });
    assert.equal(requests[0].init.headers.authorization, 'Bearer test-token');
  });

  test(`accounts.${method} rejects invalid inputs before fetching`, async () => {
    const { methods, requests } = returning({});
    const valid = [12, 'movie', 550, true, session];
    const invalid = [[], [12], [12, 'movie'], [12, 'movie', 550], [12, 'movie', 550, true]];
    for (const index of [0, 2]) {
      for (const value of [undefined, null, '12', 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        const args = [...valid]; args[index] = value; invalid.push(args);
      }
    }
    for (const value of [undefined, null, '', 'person', 'Movie', 1, {}, []]) {
      const args = [...valid]; args[1] = value; invalid.push(args);
    }
    for (const value of [undefined, null, 'true', 1, 0, {}, []]) {
      const args = [...valid]; args[3] = value; invalid.push(args);
    }
    for (const value of [undefined, null, {}, [], 'session', { sessionId: '' }, { sessionId: ' ' },
      { sessionId: 123 }, { guestSessionId: 'guest-session' }]) {
      const args = [...valid]; args[4] = value; invalid.push(args);
    }
    for (const args of invalid) await assert.rejects(methods[method](...args), TypeError);
    assert.equal(requests.length, 0);
  });

  test(`accounts.${method} rejects malformed status responses safely`, async () => {
    const invalid = [null, [], {}, 'private upstream diagnostic',
      ...[{ status_code: 0 }, { status_code: -1 }, { status_code: 1.5 },
        { status_code: Number.MAX_SAFE_INTEGER + 1 }, { status_code: '1' }, { status_code: null },
        { status_message: null }, { status_message: 42 }, { status_message: undefined },
        { success: 'true' }, { success: null }].map((patch) => ({ ...example(field), ...patch })),
    ];
    for (const payload of invalid) {
      await assert.rejects(returning(payload).methods[method](12, 'movie', 550, true, session), (error) => {
        assert.ok(error instanceof TmdbError);
        assert.equal(error.code, 'INVALID_RESPONSE');
        assert.equal(/private|test-key|session/.test(String(error)), false);
        return true;
      });
    }
    const response = { status_code: 13, status_message: 'Deleted.', success: false };
    assert.deepEqual(await returning(response).methods[method](12, 'movie', 550, false, session), response);
  });
}
