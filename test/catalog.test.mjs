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

test('G3 rejects invalid filters and account mutations before making requests', async () => {
  const { client, requests } = clientReturning({});
  const invalid = [
    () => client.movies.changeList({ startDate: '2024-02-30' }),
    () => client.movies.changeList({ startDate: '2024-05-02', endDate: '2024-05-01' }),
    () => client.movies.nowPlaying({ region: '' }),
    () => client.movies.popular({ page: 0 }),
    () => client.movies.accountStates(550, {}),
    () => client.movies.rate(550, 0.25, { sessionId: 'session' }),
    () => client.movies.rate(550, 8, {}),
    () => client.movies.deleteRating(550, { sessionId: 'a', guestSessionId: 'b' }),
    () => client.movies.reviews(-1),
    () => client.discover.movies({ releaseDateGte: '2024-02-30' }),
    () => client.discover.movies({ voteAverageGte: 8, voteAverageLte: 7 }),
    () => client.discover.tv({ withNetworks: -1 }),
    () => client.discover.tv({ unknownFilter: 'x' }),
    () => client.trending.all('month'),
    () => client.keywords.movies(1701, { includeAdult: 'false' }),
    () => client.networks.images(0),
    () => client.reviews.get('..'),
  ];
  for (const call of invalid) await assert.rejects(call(), TypeError);
  assert.equal(requests.length, 0);
});

test('G3 rejects malformed upstream identities and page shapes safely', async () => {
  const cases = [
    (client) => client.movies.nowPlaying(),
    (client) => client.movies.lists(550),
    (client) => client.movies.accountStates(550, { sessionId: 'session' }),
    (client) => client.movies.rate(550, 8, { sessionId: 'session' }),
    (client) => client.keywords.get(1701),
    (client) => client.networks.get(49),
    (client) => client.reviews.get('review-id'),
  ];
  for (const call of cases) {
    await assert.rejects(call(clientReturning({ id: 1 }).client), (error) => {
      assert.ok(error instanceof TmdbError);
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(String(error).includes('test-key'), false);
      return true;
    });
  }
  const malformedLists = { id: 550, page: 1, results: [{ id: 5 }], total_pages: 1, total_results: 1 };
  await assert.rejects(clientReturning(malformedLists).client.movies.lists(550),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE');
});

test('G3 preserves empty pages and additional TMDB fields', async () => {
  const page = { page: 1, results: [], total_pages: 0, total_results: 0, extra: { source: 'tmdb' } };
  assert.deepEqual(await clientReturning(page).client.movies.recommendations(550), page);
  assert.deepEqual(await clientReturning(page).client.trending.movies('day'), page);
  const keywordPage = { ...page, id: 1701 };
  assert.deepEqual(await clientReturning(keywordPage).client.keywords.movies(1701), keywordPage);
});

test('rating writes send JSON and an explicit session without leaking credentials', async () => {
  const response = { status_code: 1, status_message: 'Success.', upstream: true };
  const { client, requests } = clientReturning(response);
  assert.deepEqual(await client.movies.rate(550, 8.5, { guestSessionId: 'guest-id' }), response);
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].init.body), { value: 8.5 });
  assert.equal(requests[0].url.searchParams.get('guest_session_id'), 'guest-id');
  assert.equal(requests[0].url.searchParams.get('session_id'), null);
  assert.equal(requests[0].url.searchParams.get('language'), null);
  assert.deepEqual(await client.movies.deleteRating(550, { sessionId: 'session-id' }), response);
  assert.equal(requests[1].init.method, 'DELETE');
  assert.equal(requests[1].init.body, undefined);
  assert.equal(requests[1].url.searchParams.get('session_id'), 'session-id');
});
