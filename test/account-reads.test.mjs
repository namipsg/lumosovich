import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { TmdbHttpClient } from '../dist/http.js';
import { createAccountReadMethods } from '../dist/account-reads.js';

const spec = JSON.parse(fs.readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url)));
const cases = [
  ['get', '', false], ['favoriteMovies', '/favorite/movies', true], ['favoriteTv', '/favorite/tv', true],
  ['lists', '/lists', false], ['ratedMovies', '/rated/movies', true], ['ratedTv', '/rated/tv', true],
  ['ratedTvEpisodes', '/rated/tv/episodes', true], ['watchlistMovies', '/watchlist/movies', true],
  ['watchlistTv', '/watchlist/tv', true],
];
const example = (suffix) => JSON.parse(spec.paths[`/3/account/{account_id}${suffix}`].get.responses['200'].content['application/json'].examples.Result.value);
function returning(payload) {
  const requests = [];
  const methods = createAccountReadMethods(new TmdbHttpClient({ accessToken: 'private-api-token', language: 'fa-IR',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  }));
  return { methods, requests };
}

for (const [method, suffix, media] of cases) {
  test(`account.${method} accepts pinned examples and preserves raw fields`, async () => {
    const payload = { ...example(suffix), upstream_extension: { raw: true } };
    if (payload.results?.length) payload.results[0].upstream_extension = 'raw';
    assert.deepEqual(await returning(payload).methods[method](548, { sessionId: 'session' }), payload);
    if (method !== 'get') {
      const empty = { page: 1, results: [], total_pages: 0, total_results: 0 };
      assert.deepEqual(await returning(empty).methods[method](548, { sessionId: 'session' }), empty);
    }
  });

  test(`account.${method} sends only route-supported query parameters`, async () => {
    const { methods, requests } = returning(example(suffix));
    await methods[method](548, { sessionId: 'session /?&', page: 2, language: 'en-US', sortBy: 'created_at.desc' });
    assert.equal(requests[0].url.pathname, `/3/account/548${suffix}`);
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), {
      ...(media ? { language: 'en-US' } : {}), session_id: 'session /?&',
      ...(method !== 'get' ? { page: '2' } : {}), ...(media ? { sort_by: 'created_at.desc' } : {}),
    });
    assert.equal(requests[0].init.method, undefined);
    assert.equal(requests[0].init.body, undefined);
    assert.equal(requests[0].init.headers.authorization, 'Bearer private-api-token');
    await methods[method](548, { sessionId: 'session' });
    assert.deepEqual(Object.fromEntries(requests[1].url.searchParams), {
      ...(media ? { language: 'fa-IR' } : {}), session_id: 'session',
    });
  });

  test(`account.${method} rejects invalid input before fetching`, async () => {
    const { methods, requests } = returning(example(suffix));
    for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '548', null, NaN]) {
      await assert.rejects(methods[method](id, { sessionId: 'session' }), TypeError);
    }
    for (const options of [undefined, null, [], {}, { sessionId: '' }, { sessionId: ' ' }, { sessionId: 1 }]) {
      await assert.rejects(methods[method](548, options), TypeError);
    }
    if (method !== 'get') for (const page of [0, -1, 1.5, '2', null, Number.MAX_SAFE_INTEGER + 1]) {
      await assert.rejects(methods[method](548, { sessionId: 'session', page }), TypeError);
    }
    if (media) for (const options of [{ language: '' }, { language: 1 }, { sortBy: 'rating.desc' }, { sortBy: null }]) {
      await assert.rejects(methods[method](548, { sessionId: 'session', ...options }), TypeError);
    }
    assert.equal(requests.length, 0);
  });

  test(`account.${method} rejects malformed nested responses with safe errors`, async () => {
    const payload = example(suffix);
    const malformed = [null, [], {}, { ...payload, id: '548' }];
    if (method === 'get') malformed.push(
      { ...payload, id: 549 }, { ...payload, username: null }, { ...payload, include_adult: 1 },
      { ...payload, avatar: null }, { ...payload, avatar: { ...payload.avatar, gravatar: { hash: 12 } } },
      { ...payload, avatar: { ...payload.avatar, tmdb: { avatar_path: {} } } },
    );
    else {
      // An extra unrelated upstream field is permitted; the page itself must remain valid.
      malformed.pop();
      malformed.push(...['page', 'total_pages', 'total_results'].map((key) => ({ ...payload, [key]: -1 })),
        { ...payload, results: {} }, { ...payload, results: [null] });
      const item = payload.results[0];
      const itemWith = (change) => ({ ...payload, results: [{ ...item, ...change }] });
      malformed.push(itemWith({ id: 0 }), itemWith({ id: '1' }));
      if (method === 'lists') malformed.push(itemWith({ item_count: -1 }), itemWith({ favorite_count: '1' }),
        itemWith({ poster_path: {} }), itemWith({ name: null }));
      else if (method === 'ratedTvEpisodes') malformed.push(
        itemWith({ show_id: 0 }), itemWith({ season_number: -1 }), itemWith({ episode_number: 0.5 }),
        itemWith({ runtime: -1 }), itemWith({ still_path: {} }), itemWith({ name: null }),
      );
      else malformed.push(itemWith({ genre_ids: [null] }), itemWith({ overview: null }),
        itemWith({ vote_count: -1 }), itemWith({ poster_path: {} }),
        itemWith(method.endsWith('Movies') ? { title: null } : { origin_country: [3] }));
      if (method.startsWith('rated')) malformed.push(...[null, '8', 0, 10.5, 8.1].map((rating) => itemWith({ rating })));
    }
    for (const bad of malformed) await assert.rejects(returning(bad).methods[method](548, { sessionId: 'private-session' }), (error) => {
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(error.message, 'TMDB returned an unexpected response');
      assert.doesNotMatch(String(error), /private-api-token|private-session/);
      return true;
    });
  });
}

test('account get and media pages accept nullable image paths and episode metadata', async () => {
  const details = example('');
  details.avatar.tmdb.avatar_path = null;
  assert.deepEqual(await returning(details).methods.get(548, { sessionId: 'session' }), details);
  const episodes = example('/rated/tv/episodes');
  Object.assign(episodes.results[0], { air_date: null, runtime: null, still_path: null, season_number: 0, episode_number: 0 });
  assert.deepEqual(await returning(episodes).methods.ratedTvEpisodes(548, { sessionId: 'session' }), episodes);
});
