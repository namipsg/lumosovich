import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { TmdbHttpClient } from '../dist/http.js';
import { createGuestSessionMethods } from '../dist/guest-sessions.js';

const spec = JSON.parse(fs.readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url)));
const cases = [
  ['ratedMovies', 'movies', { id: 16, title: 'Movie', rating: 8.5 }],
  ['ratedTv', 'tv', { id: 1399, name: 'Series', rating: 8.5 }],
  ['ratedTvEpisodes', 'tv/episodes', {
    id: 63056, name: 'Episode', show_id: 1399, season_number: 0, episode_number: 0, rating: 8.5,
  }],
];
const page = (item) => ({ page: 1, results: [item], total_pages: 1, total_results: 1, extra: true });
function methodsReturning(payload) {
  const requests = [];
  const methods = createGuestSessionMethods(new TmdbHttpClient({ apiKey: 'test-key', language: 'fa-IR',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  }));
  return { methods, requests };
}

for (const [method, suffix, item] of cases) {
  test(`guestSessions.${method} serializes supported options and preserves raw fields`, async () => {
    const payload = page({ ...item, extension: { raw: true } });
    const { methods, requests } = methodsReturning(payload);
    assert.deepEqual(await methods[method](' guest/id?# ', {
      page: 2, language: 'en-US', sortBy: 'created_at.desc',
    }), payload);
    assert.equal(requests[0].url.pathname, `/3/guest_session/guest%2Fid%3F%23/rated/${suffix}`);
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), {
      language: 'en-US', page: '2', sort_by: 'created_at.desc', api_key: 'test-key',
    });
    assert.equal(requests[0].init.method, undefined);
    await methods[method]('guest');
    assert.deepEqual(Object.fromEntries(requests[1].url.searchParams), { language: 'fa-IR', api_key: 'test-key' });
  });

  test(`guestSessions.${method} rejects invalid input before fetch`, async () => {
    const { methods, requests } = methodsReturning(page(item));
    for (const id of ['', ' ', '.', '..', null, 1]) await assert.rejects(methods[method](id), TypeError);
    for (const options of [
      { page: 0 }, { page: 1.5 }, { page: Number.MAX_SAFE_INTEGER + 1 }, { page: '2' },
      { language: '' }, { language: 1 }, { sortBy: 'rating.desc' }, { sortBy: null },
    ]) await assert.rejects(methods[method]('guest', options), TypeError);
    assert.equal(requests.length, 0);
  });

  test(`guestSessions.${method} accepts pinned examples and empty pages`, async () => {
    const op = spec.paths[`/3/guest_session/{guest_session_id}/rated/${suffix}`].get;
    const example = JSON.parse(op.responses['200'].content['application/json'].examples.Result.value);
    for (const payload of [example, { page: 1, results: [], total_pages: 0, total_results: 0 }]) {
      assert.deepEqual(await methodsReturning(payload).methods[method]('guest'), payload);
    }
  });

  test(`guestSessions.${method} rejects malformed pages and rating data`, async () => {
    const invalid = [null, {}, { ...page(item), page: 0 }, { ...page(item), total_results: -1 },
      { ...page(item), results: {} }, page({ ...item, id: 0 }), page({ ...item, rating: '8' }),
      page({ ...item, rating: 0 }), page({ ...item, rating: 10.5 }), page({ ...item, rating: 8.1 }),
      page({ ...item, [method === 'ratedMovies' ? 'title' : 'name']: null }),
    ];
    if (method === 'ratedTvEpisodes') invalid.push(
      page({ ...item, show_id: 0 }), page({ ...item, season_number: -1 }), page({ ...item, episode_number: 1.5 }));
    for (const payload of invalid) await assert.rejects(methodsReturning(payload).methods[method]('guest'), (error) => {
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(String(error).includes('test-key'), false);
      return true;
    });
  });
}
