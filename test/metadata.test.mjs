import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

function clientReturning(payload) {
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'test-key',
    fetch: async (url) => {
      requests.push(new URL(url));
      return new Response(JSON.stringify(payload));
    },
  });
  return { client, requests };
}

test('G2 rejects bad IDs and query options before fetching', async () => {
  const { client, requests } = clientReturning({});
  await assert.rejects(client.movies.credits(0), TypeError);
  await assert.rejects(client.movies.images(1.5), TypeError);
  await assert.rejects(client.collections.get('tt1375666'), TypeError);
  await assert.rejects(client.companies.images(-1), TypeError);
  await assert.rejects(client.movies.alternativeTitles(1, { country: '' }), TypeError);
  await assert.rejects(client.movies.changes(1, { page: 0 }), TypeError);
  await assert.rejects(client.movies.changes(1, { startDate: '2024-02-30' }), TypeError);
  await assert.rejects(client.movies.changes(1, { startDate: '2024-02-02', endDate: '2024-02-01' }), TypeError);
  await assert.rejects(client.movies.images(1, { imageLanguages: [] }), TypeError);
  await assert.rejects(client.collections.images(1, { imageLanguages: ['en,fr'] }), TypeError);
  await assert.rejects(client.movies.videos(1, { language: '' }), TypeError);
  assert.equal(requests.length, 0);
});

test('G2 rejects wrong identities and malformed resource shapes with safe errors', async () => {
  const cases = [
    ['movies', 'credits', [550], { id: 551, cast: [], crew: [] }],
    ['movies', 'images', [550], { id: 550, posters: [], backdrops: [] }],
    ['movies', 'externalIds', [550], { id: 550, imdb_id: 550 }],
    ['movies', 'watchProviders', [550], { id: 550, results: { US: { buy: 'invalid' } } }],
    ['movies', 'changes', [550], { changes: [{ key: 'images', items: null }] }],
    ['movies', 'latest', [], { id: 5, name: 'Not a movie' }],
    ['collections', 'get', [10], { id: 10, name: 'Star Wars', parts: 'invalid' }],
    ['collections', 'translations', [10], { id: 10, translations: [{ name: 'French' }] }],
    ['companies', 'get', [1], { id: 1, description: 'No name' }],
    ['companies', 'images', [1], { id: 1, logos: [null] }],
  ];
  for (const [namespace, method, args, payload] of cases) {
    const { client } = clientReturning(payload);
    await assert.rejects(client[namespace][method](...args), (error) => {
      assert.ok(error instanceof TmdbError);
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(String(error).includes('test-key'), false);
      return true;
    });
  }
});

test('G2 preserves empty collections and additional TMDB fields', async () => {
  const collection = { id: 10, name: 'Example Collection', parts: [], additional: { upstream: true } };
  const company = { id: 1, name: 'Example Studio', parent_company: null, additional: true };
  const changes = { changes: [], additional: true };
  assert.deepEqual(await clientReturning(collection).client.collections.get(10), collection);
  assert.deepEqual(await clientReturning(company).client.companies.get(1), company);
  assert.deepEqual(await clientReturning(changes).client.movies.changes(550), changes);
  const { client, requests } = clientReturning({ id: 550, results: {} });
  assert.deepEqual(await client.movies.watchProviders(550), { id: 550, results: {} });
  assert.deepEqual(Object.fromEntries(requests[0].searchParams), { api_key: 'test-key' });
});
