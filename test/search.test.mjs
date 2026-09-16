import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

function paged(results) {
  return { page: 2, results, total_pages: 3, total_results: 42 };
}

function clientReturning(payload) {
  const requests = [];
  const client = new Lumosovich({
    accessToken: 'test-token',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  return { client, requests };
}

test('movie search encodes query and maps filters without changing raw fields', async () => {
  const expected = paged([
    {
      id: 27205,
      title: 'Inception',
      release_date: '2010-07-16',
      poster_path: '/poster.jpg',
    },
  ]);
  const { client, requests } = clientReturning(expected);

  const result = await client.search.movies(' Inception & Dreams ', {
    language: 'fa-IR',
    page: 2,
    includeAdult: false,
    year: 2010,
    primaryReleaseYear: 2010,
    region: 'US',
  });

  assert.deepEqual(result, expected);
  assert.equal(requests[0].url.pathname, '/3/search/movie');
  assert.equal(requests[0].url.searchParams.get('query'), 'Inception & Dreams');
  assert.equal(requests[0].url.searchParams.get('language'), 'fa-IR');
  assert.equal(requests[0].url.searchParams.get('page'), '2');
  assert.equal(requests[0].url.searchParams.get('include_adult'), 'false');
  assert.equal(requests[0].url.searchParams.get('year'), '2010');
  assert.equal(requests[0].url.searchParams.get('primary_release_year'), '2010');
  assert.equal(requests[0].url.searchParams.get('region'), 'US');
  assert.equal(requests[0].url.searchParams.has('api_key'), false);
  assert.equal(requests[0].init.headers.authorization, 'Bearer test-token');
});

test('TV search maps first-air year separately from general year', async () => {
  const expected = paged([{ id: 1399, name: 'Game of Thrones' }]);
  const { client, requests } = clientReturning(expected);

  assert.deepEqual(
    await client.search.tv('Game of Thrones', {
      year: 2011,
      firstAirDateYear: 2011,
    }),
    expected,
  );
  assert.equal(requests[0].url.pathname, '/3/search/tv');
  assert.equal(requests[0].url.searchParams.get('year'), '2011');
  assert.equal(requests[0].url.searchParams.get('first_air_date_year'), '2011');
});

test('multi-search retains movie, TV, and person types for caller filtering', async () => {
  const expected = paged([
    { id: 1, media_type: 'movie', title: 'Example' },
    { id: 2, media_type: 'tv', name: 'Example' },
    { id: 3, media_type: 'person', name: 'Example Person' },
  ]);
  const { client, requests } = clientReturning(expected);

  const result = await client.search.multi('Example', { page: 2 });

  assert.deepEqual(result, expected);
  assert.equal(requests[0].url.pathname, '/3/search/multi');
  assert.equal(requests[0].url.searchParams.get('page'), '2');
  assert.equal(requests[0].url.searchParams.has('year'), false);
});

test('invalid inputs fail before making a network request', async () => {
  const { client, requests } = clientReturning(paged([]));
  await assert.rejects(client.search.movies('   '), TypeError);
  await assert.rejects(client.search.movies('A', { page: 0 }), TypeError);
  await assert.rejects(client.search.movies('A', { year: 99 }), TypeError);
  await assert.rejects(client.search.tv('A', { firstAirDateYear: 10000 }), TypeError);
  await assert.rejects(client.search.multi('A', { includeAdult: 'yes' }), TypeError);
  assert.equal(requests.length, 0);
});

test('malformed page or unknown multi media type is rejected', async () => {
  const malformedPage = clientReturning({ results: [] });
  await assert.rejects(
    malformedPage.client.search.movies('A'),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );

  const unknownType = clientReturning(
    paged([{ id: 1, media_type: 'collection' }]),
  );
  await assert.rejects(
    unknownType.client.search.multi('A'),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );
});
