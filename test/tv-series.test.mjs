import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

function clientReturning(payload) {
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'test-key',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  });
  return { client, requests };
}

test('G4 validates TV series inputs before sending requests', async () => {
  const { client, requests } = clientReturning({});
  const invalid = [
    () => client.tv.airingToday({ page: 0 }),
    () => client.tv.onTheAir({ timezone: ' ' }),
    () => client.tv.popular({ page: 1.5 }),
    () => client.tv.accountStates(1399, {}),
    () => client.tv.rate(1399, 0.25, { sessionId: 'session' }),
    () => client.tv.rate(1399, 8, { sessionId: 'a', guestSessionId: 'b' }),
    () => client.tv.deleteRating(1399, {}),
    () => client.tv.aggregateCredits(-1),
    () => client.tv.images(1399, { imageLanguages: [] }),
    () => client.tv.videos(1399, { videoLanguages: ['en,fr'] }),
    () => client.tv.watchProviders(0),
  ];
  for (const call of invalid) await assert.rejects(call(), TypeError);
  assert.equal(requests.length, 0);
});

test('G4 rejects malformed TV series responses safely', async () => {
  const cases = [
    [(client) => client.tv.aggregateCredits(1399), { id: 1, cast: [], crew: [] }],
    [(client) => client.tv.alternativeTitles(1399), { id: 1399, results: [{ title: 'x' }] }],
    [(client) => client.tv.contentRatings(1399), { id: 1399, results: [{ rating: 'TV-MA' }] }],
    [(client) => client.tv.screenedTheatrically(1399), { id: 1399, results: [{ id: 2, season_number: -1, episode_number: 1 }] }],
    [(client) => client.tv.latest(), { id: 1399, title: 'Not a TV name' }],
    [(client) => client.tv.airingToday(), { page: 1, results: [{ name: 'Missing ID' }], total_pages: 1, total_results: 1 }],
    [(client) => client.tv.lists(1399), { id: 1399, page: 1, results: [{ id: 5 }], total_pages: 1, total_results: 1 }],
    [(client) => client.tv.accountStates(1399, { sessionId: 'session' }), { id: 1399, favorite: true, rated: 11, watchlist: false }],
  ];
  for (const [call, payload] of cases) {
    await assert.rejects(call(clientReturning(payload).client), (error) => {
      assert.ok(error instanceof TmdbError);
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(String(error).includes('test-key'), false);
      return true;
    });
  }
});

test('G4 preserves empty TV pages and additional response fields', async () => {
  const page = { page: 1, results: [], total_pages: 0, total_results: 0, extra: { source: 'tmdb' } };
  assert.deepEqual(await clientReturning(page).client.tv.popular(), page);
  assert.deepEqual(await clientReturning(page).client.tv.recommendations(1399), page);
  const titles = { id: 1399, results: [], extra: true };
  assert.deepEqual(await clientReturning(titles).client.tv.alternativeTitles(1399), titles);
});

test('TV rating writes use an explicit session and validated JSON body', async () => {
  const response = { status_code: 1, status_message: 'Success.' };
  const { client, requests } = clientReturning(response);
  assert.deepEqual(await client.tv.rate(1399, 8.5, { guestSessionId: 'guest-id' }), response);
  assert.equal(requests[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].init.body), { value: 8.5 });
  assert.equal(requests[0].url.searchParams.get('guest_session_id'), 'guest-id');
  assert.equal(requests[0].url.searchParams.get('language'), null);
  assert.deepEqual(await client.tv.deleteRating(1399, { sessionId: 'session-id' }), response);
  assert.equal(requests[1].init.method, 'DELETE');
  assert.equal(requests[1].url.searchParams.get('session_id'), 'session-id');
});
