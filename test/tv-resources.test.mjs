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

test('G5 validates coordinates, change filters, group IDs, and sessions before fetch', async () => {
  const { client, requests } = clientReturning({});
  const invalid = [
    () => client.tv.changeList({ startDate: '2024-02-30' }),
    () => client.tv.changes(1399, { startDate: '2024-05-02', endDate: '2024-05-01' }),
    () => client.tv.episodeGroups.list(0),
    () => client.tv.episodeGroups.get('..'),
    () => client.tv.seasons.changes(-1),
    () => client.tv.seasons.credits(1399, -1),
    () => client.tv.seasons.images(1399, 1, { imageLanguages: [] }),
    () => client.tv.seasons.accountStates(1399, 1, {}),
    () => client.tv.episodes.changes(0),
    () => client.tv.episodes.videos(1399, 1, 1, { videoLanguages: ['en,fr'] }),
    () => client.tv.episodes.accountStates(1399, 1, 1, {}),
    () => client.tv.episodes.rate(1399, 1, 1, 0.25, { sessionId: 'session' }),
    () => client.tv.episodes.rate(1399, 1, 1, 8, { sessionId: 'a', guestSessionId: 'b' }),
    () => client.tv.episodes.deleteRating(1399, 1, 1, {}),
  ];
  for (const call of invalid) await assert.rejects(call(), TypeError);
  assert.equal(requests.length, 0);
});

test('G5 rejects malformed nested TV responses with safe errors', async () => {
  const cases = [
    [(client) => client.tv.episodeGroups.list(1399), { id: 1, results: [] }],
    [(client) => client.tv.episodeGroups.get('group-id'), { id: 'group-id', name: 'Group', groups: [{ id: 'a', name: 'A', order: 0, episodes: [{ id: 1, name: 'Episode', season_number: -1, episode_number: 1 }] }] }],
    [(client) => client.tv.seasons.accountStates(1399, 1, { sessionId: 'session' }), { id: 3624, results: [{ id: 63056, episode_number: 1, rated: { value: 11 } }] }],
    [(client) => client.tv.seasons.aggregateCredits(1399, 1), { id: 3624, cast: [{ name: 'Missing ID' }], crew: [] }],
    [(client) => client.tv.seasons.watchProviders(1399, 1), { id: 3624, results: [] }],
    [(client) => client.tv.episodes.accountStates(1399, 1, 1, { sessionId: 'session' }), { id: 63056, favorite: true, rated: false }],
    [(client) => client.tv.episodes.credits(1399, 1, 1), { id: 63056, cast: [], crew: [], guest_stars: [{ name: 'Missing ID' }] }],
    [(client) => client.tv.episodes.images(1399, 1, 1), { id: 63056, stills: [{ width: 100 }] }],
    [(client) => client.tv.episodes.changes(63056), { changes: [{ key: 'name', items: [null] }] }],
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

test('G5 preserves empty collections and additional TMDB fields', async () => {
  const groups = { id: 1399, results: [], upstream: true };
  assert.deepEqual(await clientReturning(groups).client.tv.episodeGroups.list(1399), groups);
  const changes = { changes: [], upstream: { source: 'tmdb' } };
  assert.deepEqual(await clientReturning(changes).client.tv.seasons.changes(3624), changes);
  const providers = { id: 3624, results: {}, upstream: true };
  assert.deepEqual(await clientReturning(providers).client.tv.seasons.watchProviders(1399, 1), providers);
});

test('episode ratings send validated JSON and an explicit session', async () => {
  const response = { status_code: 1, status_message: 'Success.' };
  const { client, requests } = clientReturning(response);
  assert.deepEqual(await client.tv.episodes.rate(1399, 1, 1, 8.5, { guestSessionId: 'guest-id' }), response);
  assert.equal(requests[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].init.body), { value: 8.5 });
  assert.equal(requests[0].url.searchParams.get('guest_session_id'), 'guest-id');
  assert.equal(requests[0].url.searchParams.get('language'), null);
  assert.deepEqual(await client.tv.episodes.deleteRating(1399, 1, 1, { sessionId: 'session-id' }), response);
  assert.equal(requests[1].init.method, 'DELETE');
  assert.equal(requests[1].url.searchParams.get('session_id'), 'session-id');
  assert.equal(requests[1].init.body, undefined);
});
