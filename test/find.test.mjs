import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich } from '../dist/index.js';

const emptyFindResponse = () => ({
  movie_results: [],
  tv_results: [],
  tv_season_results: [],
  tv_episode_results: [],
  person_results: [],
});

function clientReturning(payload) {
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'test-key',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  return { client, requests };
}

test('finds an IMDb movie ID and preserves the numeric TMDB ID', async () => {
  const expected = {
    ...emptyFindResponse(),
    movie_results: [{ id: 27205, title: 'Inception', poster_path: '/poster.jpg' }],
  };
  const { client, requests } = clientReturning(expected);

  const result = await client.find.byExternalId('tt1375666', 'imdb_id');

  assert.deepEqual(result, expected);
  assert.equal(result.movie_results[0].id, 27205);
  assert.equal(requests[0].url.pathname, '/3/find/tt1375666');
  assert.equal(requests[0].url.searchParams.get('external_source'), 'imdb_id');
  assert.equal(requests[0].url.searchParams.get('language'), 'en-US');
  assert.equal(requests[0].url.searchParams.get('api_key'), 'test-key');
});

test('keeps episode context from an IMDb episode lookup', async () => {
  const expected = {
    ...emptyFindResponse(),
    tv_episode_results: [
      { id: 63056, show_id: 1399, season_number: 1, episode_number: 1 },
    ],
  };
  const { client } = clientReturning(expected);

  const result = await client.find.byExternalId('tt1480055', 'imdb_id');

  assert.deepEqual(result.tv_episode_results, expected.tv_episode_results);
});

test('returns person matches for an IMDb name ID', async () => {
  const expected = {
    ...emptyFindResponse(),
    person_results: [{ id: 6193, name: 'Leonardo DiCaprio' }],
  };
  const { client } = clientReturning(expected);

  const result = await client.find.byExternalId('nm0000138', 'imdb_id');

  assert.deepEqual(result.person_results, expected.person_results);
});

test('preserves no matches and multiple matches without guessing', async () => {
  const noMatch = clientReturning(emptyFindResponse());
  assert.deepEqual(
    await noMatch.client.find.byExternalId('tt0000000', 'imdb_id'),
    emptyFindResponse(),
  );

  const ambiguous = {
    ...emptyFindResponse(),
    movie_results: [{ id: 1 }, { id: 2 }],
  };
  const multiple = clientReturning(ambiguous);
  assert.deepEqual(
    (await multiple.client.find.byExternalId('tt1234567', 'imdb_id')).movie_results,
    [{ id: 1 }, { id: 2 }],
  );
});

test('accepts a read-access token without putting it in the URL', async () => {
  const requests = [];
  const client = new Lumosovich({
    accessToken: 'test-token',
    language: 'fa-IR',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(emptyFindResponse()), { status: 200 });
    },
  });

  await client.find.byExternalId('tt1375666', 'imdb_id');

  assert.equal(requests[0].url.searchParams.has('api_key'), false);
  assert.equal(requests[0].url.searchParams.get('language'), 'fa-IR');
  assert.equal(requests[0].init.headers.authorization, 'Bearer test-token');
});

test('rejects missing or conflicting credentials', () => {
  assert.throws(() => new Lumosovich({}), TypeError);
  assert.throws(
    () => new Lumosovich({ apiKey: 'key', accessToken: 'token' }),
    TypeError,
  );
});

test('supports every documented external source and encodes external IDs', async () => {
  const sources = [
    'imdb_id', 'facebook_id', 'instagram_id', 'tvdb_id',
    'tiktok_id', 'twitter_id', 'wikidata_id', 'youtube_id',
  ];
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'test-key',
    fetch: async (url) => {
      requests.push(new URL(url));
      return new Response(JSON.stringify({
        movie_results: [], tv_results: [], person_results: [],
        tv_season_results: [], tv_episode_results: [],
      }));
    },
  });
  for (const source of sources) {
    await client.find.byExternalId(' A/B?C&D ', source);
    const url = requests.at(-1);
    assert.equal(url.pathname, '/3/find/A%2FB%3FC%26D');
    assert.equal(url.searchParams.get('external_source'), source);
  }
  for (const source of ['unknown', '', null, 42]) {
    await assert.rejects(client.find.byExternalId('id', source), TypeError);
  }
  for (const id of ['', ' ', null, 42, '.', ' .. ']) {
    await assert.rejects(client.find.byExternalId(id, 'imdb_id'), TypeError);
  }
  assert.equal(requests.length, sources.length);
});
