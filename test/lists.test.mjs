import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { createListMethods } from '../dist/lists.js';
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
const session = { sessionId: 'private-session' };
const operations = [
  ['create', [{ ...session, name: 'My list', description: '', language: 'fa' }], 'list-create', 'POST', 'list', { session_id: session.sessionId }, { name: 'My list', description: '', language: 'fa' }],
  ['get', [1, { page: 2, language: 'fa-IR' }], 'list-details', 'GET', 'list/1', { page: '2', language: 'fa-IR' }],
  ['itemStatus', [1, 550, { language: 'fa-IR' }], 'list-check-item-status', 'GET', 'list/1/item_status', { movie_id: '550', language: 'fa-IR' }],
  ['addMovie', [1, 550, session], 'list-add-movie', 'POST', 'list/1/add_item', { session_id: session.sessionId }, { media_id: 550 }],
  ['removeMovie', [1, 550, session], 'list-remove-movie', 'POST', 'list/1/remove_item', { session_id: session.sessionId }, { media_id: 550 }],
  ['clear', [1, { ...session, confirm: true }], 'list-clear', 'POST', 'list/1/clear', { session_id: session.sessionId, confirm: 'true' }],
  ['delete', [1, session], 'list-delete', 'DELETE', 'list/1', { session_id: session.sessionId }],
];
function returning(payload) {
  const requests = [];
  const methods = createListMethods(new TmdbHttpClient({
    apiKey: 'test-key', language: 'en-US',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  }));
  return { methods, requests };
}
for (const [method, args, operationId, verb, path, query, body] of operations) {
  test(`lists.${method} matches pinned ${operationId} request and response`, async () => {
    const payload = example(operationId);
    const { methods, requests } = returning(payload);
    assert.deepEqual(await methods[method](...args), payload);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.pathname, `/3/${path}`);
    assert.equal(requests[0].init.method ?? 'GET', verb);
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), { ...query, api_key: 'test-key' });
    assert.deepEqual(requests[0].init.body === undefined ? undefined : JSON.parse(requests[0].init.body), body);
  });
}

test('list defaults, optional create fields, explicit false confirmation and empty lists are retained', async () => {
  const details = { ...example('list-details'), items: [], item_count: 0, poster_path: null, extra: true };
  const { methods, requests } = returning(details);
  assert.deepEqual(await methods.get(1), details);
  assert.equal(requests[0].url.searchParams.get('language'), 'en-US');
  assert.equal(requests[0].url.searchParams.has('page'), false);
  assert.deepEqual(await returning({ ...details, id: 1 }).methods.get(1), { ...details, id: 1 });
  const create = returning(example('list-create'));
  await create.methods.create({ ...session, name: 'List' });
  assert.deepEqual(JSON.parse(create.requests[0].init.body), { name: 'List' });
  const clear = returning(example('list-clear'));
  await clear.methods.clear(1, { ...session, confirm: false });
  assert.equal(clear.requests[0].url.searchParams.get('confirm'), 'false');
  const status = returning({ id: 1, item_present: false });
  assert.equal((await status.methods.itemStatus(1, 550)).item_present, false);
  assert.equal((await returning({ id: '1', item_present: false }).methods.itemStatus(1, 550)).id, '1');
});

test('lists reject invalid arguments before requesting, including missing user sessions', async () => {
  const { methods, requests } = returning({});
  const invalid = [
    ['create', []], ['create', [null]], ['create', [{ name: 'List' }]],
    ['create', [{ ...session, name: ' ' }]], ['create', [{ ...session, name: 'List', description: 7 }]],
    ['create', [{ ...session, name: 'List', language: ' ' }]],
    ['get', [1, null]], ['get', [1, { page: 0 }]], ['get', [1, { page: '2' }]],
    ['get', [1, { page: 1.5 }]], ['get', [1, { language: 7 }]],
    ['itemStatus', [1, 550, null]], ['itemStatus', [1, 550, { language: '' }]],
    ['itemStatus', [1, 0]], ['addMovie', [1, 0, session]], ['removeMovie', [1, '550', session]],
    ['clear', [1, session]], ['clear', [1, { ...session, confirm: 'true' }]],
  ];
  for (const method of ['get', 'itemStatus', 'addMovie', 'removeMovie', 'clear', 'delete']) {
    for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', null]) {
      invalid.push([method, [id, 550, session]]);
    }
  }
  for (const [method, args] of operations.filter((row) => !['get', 'itemStatus', 'create'].includes(row[0]))) {
    for (const badSession of [undefined, null, {}, { sessionId: '' }, { sessionId: ' ' }, { sessionId: 123 }, { guestSessionId: 'guest' }]) {
      invalid.push([method, method === 'addMovie' || method === 'removeMovie' ? [1, 550, badSession] : [1, badSession]]);
    }
  }
  for (const [method, args] of invalid) await assert.rejects(methods[method](...args), TypeError, `${method} ${JSON.stringify(args)}`);
  assert.equal(requests.length, 0);
});

test('lists validate identity and nested fields and expose safe INVALID_RESPONSE errors', async () => {
  const details = example('list-details');
  const badDetails = [
    { ...details, id: '2' }, { ...details, id: '01' }, { ...details, name: null },
    { ...details, item_count: -1 }, { ...details, favorite_count: 1.5 },
    { ...details, poster_path: 3 }, { ...details, items: null },
    ...[{ id: 0 }, { title: null }, { genre_ids: ['28'] }, { media_type: 'tv' }, { vote_count: -1 }, { video: 'false' }, { backdrop_path: false }, { popularity: null }]
      .map((patch) => ({ ...details, items: [{ ...details.items[0], ...patch }] })),
  ];
  const invalid = [
    ...badDetails.map((payload) => ['get', [1], payload]),
    ['itemStatus', [1, 550], { id: 2, item_present: true }],
    ['itemStatus', [1, 550], { id: 1, item_present: 1 }],
    ['create', [{ ...session, name: 'List' }], { ...example('list-create'), list_id: 0 }],
    ['create', [{ ...session, name: 'List' }], { ...example('list-create'), success: undefined }],
  ];
  for (const [method, args] of operations) {
    for (const payload of [null, [], {}, 'private upstream diagnostic']) invalid.push([method, args, payload]);
    if (!['get', 'itemStatus', 'create'].includes(method)) {
      for (const patch of [{ status_code: 0 }, { status_code: 1.5 }, { status_message: 4 }, { success: 'true' }]) {
        invalid.push([method, args, { ...example('list-add-movie'), ...patch }]);
      }
    }
  }
  for (const [method, args, payload] of invalid) {
    await assert.rejects(returning(payload).methods[method](...args), (error) => {
      assert.ok(error instanceof TmdbError);
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(/private|test-key/.test(String(error)), false);
      return true;
    });
  }
});

test('nullable list artwork and unknown upstream fields survive validation', async () => {
  const details = example('list-details');
  const payload = { ...details, extra: 'retained', items: [{ ...details.items[0], poster_path: null, backdrop_path: null, extra: true }] };
  assert.deepEqual(await returning(payload).methods.get(1), payload);
  const mutation = { ...example('list-add-movie'), success: true, extra: true };
  assert.deepEqual(await returning(mutation).methods.addMovie(1, 550, session), mutation);
});
