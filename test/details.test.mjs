import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

function clientReturning(payload) {
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'test-key',
    fetch: async (url) => {
      requests.push(new URL(url));
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
  return { client, requests };
}

test('movie details default to the minimal top-level request', async () => {
  const expected = {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    overview: 'A description',
    vote_average: 8.4,
    poster_path: '/poster.jpg',
  };
  const { client, requests } = clientReturning(expected);

  assert.deepEqual(await client.movies.get(27205), expected);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].pathname, '/3/movie/27205');
  assert.equal(requests[0].searchParams.has('append_to_response'), false);
  assert.equal(requests[0].searchParams.has('include_image_language'), false);
  assert.equal(requests[0].searchParams.get('language'), 'en-US');
});

test('movie enrichment is opt-in and includes image language fallbacks', async () => {
  const expected = {
    id: 27205,
    title: 'Inception',
    credits: {
      cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cobb' }],
      crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director' }],
    },
    images: {
      posters: [{ file_path: '/poster.jpg', iso_639_1: 'en' }],
      backdrops: [{ file_path: '/backdrop.jpg', iso_639_1: null }],
    },
    videos: {
      results: [{ id: 'video-1', key: 'abc', name: 'Trailer', site: 'YouTube', type: 'Trailer' }],
    },
    external_ids: { imdb_id: 'tt1375666' },
    release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] }] },
  };
  const { client, requests } = clientReturning(expected);

  const result = await client.movies.get(27205, {
    language: 'fa-IR',
    append: ['credits', 'images', 'videos', 'external_ids', 'release_dates', 'images'],
    imageLanguages: ['fa', 'en', 'null'],
  });

  assert.deepEqual(result, expected);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].searchParams.get('language'), 'fa-IR');
  assert.equal(
    requests[0].searchParams.get('append_to_response'),
    'credits,images,videos,external_ids,release_dates',
  );
  assert.equal(requests[0].searchParams.get('include_image_language'), 'fa,en,null');
  assert.equal(result.vote_average, undefined);
});

test('TV details can request whole-series cast and region ratings', async () => {
  const expected = {
    id: 1399,
    name: 'Game of Thrones',
    seasons: [{ id: 3624, season_number: 1, episode_count: 10 }],
    aggregate_credits: {
      cast: [{ id: 22970, name: 'Peter Dinklage', roles: [{ character: 'Tyrion', episode_count: 67 }] }],
      crew: [],
    },
    content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-MA' }] },
    images: { posters: [], backdrops: [{ file_path: '/still.jpg' }] },
  };
  const { client, requests } = clientReturning(expected);

  assert.deepEqual(
    await client.tv.get(1399, {
      append: ['aggregate_credits', 'content_ratings', 'images'],
      imageLanguages: ['en', 'null'],
    }),
    expected,
  );
  assert.equal(requests[0].pathname, '/3/tv/1399');
  assert.equal(
    requests[0].searchParams.get('append_to_response'),
    'aggregate_credits,content_ratings,images',
  );
  assert.equal(requests[0].searchParams.get('include_image_language'), 'en,null');
});

test('person details preserve biography, portrait, external ID, and combined credits', async () => {
  const expected = {
    id: 6193,
    name: 'Leonardo DiCaprio',
    biography: 'An actor',
    birthday: '1974-11-11',
    deathday: null,
    profile_path: '/portrait.jpg',
    combined_credits: {
      cast: [{ id: 27205, media_type: 'movie', title: 'Inception', character: 'Cobb' }],
      crew: [
        { id: 10, media_type: 'movie', title: 'Example', job: 'Director' },
        { id: 11, media_type: 'tv', name: 'Example Show', job: 'Writer' },
      ],
    },
    external_ids: { imdb_id: 'nm0000138' },
    images: { profiles: [{ file_path: '/portrait.jpg' }] },
  };
  const { client, requests } = clientReturning(expected);

  const result = await client.people.get(6193, {
    append: ['combined_credits', 'external_ids', 'images'],
  });

  assert.deepEqual(result, expected);
  assert.equal(requests[0].pathname, '/3/person/6193');
  assert.equal(
    requests[0].searchParams.get('append_to_response'),
    'combined_credits,external_ids,images',
  );
  assert.equal('awards' in result, false);
  assert.equal('height' in result, false);
});

test('an IMDb person lookup can feed the numeric person detail method', async () => {
  const requests = [];
  const findResponse = {
    movie_results: [],
    tv_results: [],
    tv_season_results: [],
    tv_episode_results: [],
    person_results: [{ id: 6193, name: 'Leonardo DiCaprio' }],
  };
  const client = new Lumosovich({
    apiKey: 'test-key',
    fetch: async (url) => {
      const request = new URL(url);
      requests.push(request);
      const payload = request.pathname.startsWith('/3/find/')
        ? findResponse
        : { id: 6193, name: 'Leonardo DiCaprio', profile_path: '/portrait.jpg' };
      return new Response(JSON.stringify(payload));
    },
  });

  const matches = await client.find.byExternalId('nm0000138', 'imdb_id');
  const person = await client.people.get(matches.person_results[0].id);

  assert.equal(person.profile_path, '/portrait.jpg');
  assert.deepEqual(requests.map((request) => request.pathname), [
    '/3/find/nm0000138',
    '/3/person/6193',
  ]);
});

test('numeric ID and append options fail before a request', async () => {
  const { client, requests } = clientReturning({ id: 1, title: 'A' });
  await assert.rejects(client.movies.get('tt1375666'), TypeError);
  await assert.rejects(client.movies.get(0), TypeError);
  await assert.rejects(client.movies.get(1.5), TypeError);
  await assert.rejects(client.movies.get(1, { append: ['aggregate_credits'] }), TypeError);
  await assert.rejects(client.movies.get(1, { imageLanguages: ['en'] }), TypeError);
  await assert.rejects(client.movies.get(1, { append: ['images'], imageLanguages: [] }), TypeError);
  await assert.rejects(client.people.get(1, { append: ['credits'] }), TypeError);
  assert.equal(requests.length, 0);
});

test('detail responses reject wrong identity and missing names', async () => {
  const wrongIdentity = clientReturning({ id: 999, title: 'Wrong' });
  await assert.rejects(
    wrongIdentity.client.movies.get(27205),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );

  const missingName = clientReturning({ id: 6193, biography: 'Unknown' });
  await assert.rejects(
    missingName.client.people.get(6193),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );
});
