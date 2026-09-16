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

test('season details return numeric episode IDs and slot context', async () => {
  const expected = {
    id: 3624,
    season_number: 1,
    name: 'Season 1',
    episodes: [
      {
        id: 63056,
        show_id: 1399,
        season_number: 1,
        episode_number: 1,
        name: 'Winter Is Coming',
        still_path: '/still.jpg',
      },
    ],
  };
  const { client, requests } = clientReturning(expected);

  assert.deepEqual(await client.tv.seasons.get(1399, 1), expected);
  assert.equal(requests[0].pathname, '/3/tv/1399/season/1');
  assert.equal(requests[0].searchParams.has('append_to_response'), false);
  assert.equal(expected.episodes[0].id, 63056);
});

test('season zero supports TMDB specials', async () => {
  const expected = {
    id: 1,
    season_number: 0,
    name: 'Specials',
    episodes: [{ id: 2, show_id: 1399, season_number: 0, episode_number: 0, name: 'Special' }],
  };
  const { client, requests } = clientReturning(expected);

  assert.deepEqual(await client.tv.seasons.get(1399, 0), expected);
  assert.equal(requests[0].pathname, '/3/tv/1399/season/0');
});

test('episode details support optional external IDs and image fallback', async () => {
  const expected = {
    id: 63056,
    show_id: 1399,
    season_number: 1,
    episode_number: 1,
    name: 'Winter Is Coming',
    overview: 'An episode',
    air_date: '2011-04-17',
    runtime: 62,
    still_path: '/still.jpg',
    external_ids: { imdb_id: 'tt1480055' },
    images: { backdrops: [{ file_path: '/still.jpg', iso_639_1: null }] },
  };
  const { client, requests } = clientReturning(expected);

  const result = await client.tv.episodes.get(1399, 1, 1, {
    language: 'fa-IR',
    append: ['external_ids', 'images'],
    imageLanguages: ['en', 'null'],
  });

  assert.deepEqual(result, expected);
  assert.equal(requests[0].pathname, '/3/tv/1399/season/1/episode/1');
  assert.equal(requests[0].searchParams.get('language'), 'fa-IR');
  assert.equal(requests[0].searchParams.get('append_to_response'), 'external_ids,images');
  assert.equal(requests[0].searchParams.get('include_image_language'), 'en,null');
});

test('episode details accept an omitted show_id but reject a conflicting one', async () => {
  const episode = {
    id: 63056,
    season_number: 1,
    episode_number: 1,
    name: 'Winter Is Coming',
  };
  const missing = clientReturning(episode);
  assert.deepEqual(await missing.client.tv.episodes.get(1399, 1, 1), episode);

  const wrong = clientReturning({ ...episode, show_id: 999 });
  await assert.rejects(
    wrong.client.tv.episodes.get(1399, 1, 1),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );
});

test('season and episode identity mismatches are rejected', async () => {
  const wrongSeason = clientReturning({
    id: 3624,
    season_number: 2,
    name: 'Season 2',
    episodes: [],
  });
  await assert.rejects(
    wrongSeason.client.tv.seasons.get(1399, 1),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );

  const wrongSeriesRow = clientReturning({
    id: 3624,
    season_number: 1,
    name: 'Season 1',
    episodes: [
      { id: 63056, show_id: 999, season_number: 1, episode_number: 1, name: 'Wrong' },
    ],
  });
  await assert.rejects(
    wrongSeriesRow.client.tv.seasons.get(1399, 1),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );

  const wrongEpisode = clientReturning({
    id: 63056,
    show_id: 1399,
    season_number: 1,
    episode_number: 2,
    name: 'Wrong',
  });
  await assert.rejects(
    wrongEpisode.client.tv.episodes.get(1399, 1, 1),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );
});

test('invalid numeric coordinates and append targets fail before fetch', async () => {
  const { client, requests } = clientReturning({});
  await assert.rejects(client.tv.seasons.get('tt0944947', 1), TypeError);
  await assert.rejects(client.tv.seasons.get(1399, -1), TypeError);
  await assert.rejects(client.tv.episodes.get(1399, 1, -1), TypeError);
  await assert.rejects(client.tv.episodes.get(1399, 1.5, 1), TypeError);
  await assert.rejects(
    client.tv.seasons.get(1399, 1, { append: ['external_ids'] }),
    TypeError,
  );
  assert.equal(requests.length, 0);
});
