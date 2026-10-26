import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { TmdbHttpClient } from '../dist/http.js';
import { createWatchProviderMethods } from '../dist/watch-providers.js';

const spec = JSON.parse(fs.readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url)));
const country = { iso_3166_1: 'IR', english_name: 'Iran', native_name: 'ایران', extension: true };
const provider = { provider_id: 2, provider_name: 'Provider', logo_path: '/logo.jpg',
  display_priority: 0, display_priorities: { IR: 0, US: 5 }, extension: true };
const cases = [['regions', 'regions', country], ['movies', 'movie', provider], ['tv', 'tv', provider]];
function methodsReturning(payload) {
  const requests = [];
  const methods = createWatchProviderMethods(new TmdbHttpClient({ accessToken: 'test-token', language: 'fa-IR',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  }));
  return { methods, requests };
}

for (const [method, suffix, item] of cases) {
  test(`watchProviders.${method} sends supported options and preserves raw fields`, async () => {
    const payload = { results: [item], extension: true };
    const { methods, requests } = methodsReturning(payload);
    assert.deepEqual(await methods[method]({ language: 'en-US', watchRegion: 'US' }), payload);
    assert.equal(requests[0].url.pathname, `/3/watch/providers/${suffix}`);
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), {
      language: 'en-US', ...(method === 'regions' ? {} : { watch_region: 'US' }),
    });
    assert.equal(requests[0].init.headers.authorization, 'Bearer test-token');
    assert.equal(requests[0].init.method, undefined);
    await methods[method]();
    assert.deepEqual(Object.fromEntries(requests[1].url.searchParams), { language: 'fa-IR' });
  });

  test(`watchProviders.${method} accepts pinned examples and empty lists`, async () => {
    const op = spec.paths[`/3/watch/providers/${suffix}`].get;
    const example = JSON.parse(op.responses['200'].content['application/json'].examples.Result.value);
    for (const payload of [example, { results: [], extension: true }]) {
      assert.deepEqual(await methodsReturning(payload).methods[method](), payload);
    }
  });

  test(`watchProviders.${method} rejects invalid options before fetch`, async () => {
    const { methods, requests } = methodsReturning({ results: [item] });
    const options = [{ language: '' }, { language: ' ' }, { language: 1 }];
    if (method !== 'regions') options.push({ watchRegion: '' }, { watchRegion: ' ' }, { watchRegion: 1 });
    for (const value of options) await assert.rejects(methods[method](value), TypeError);
    assert.equal(requests.length, 0);
  });

  test(`watchProviders.${method} rejects malformed response data`, async () => {
    const invalid = [null, {}, { results: {} }, { results: [null] }];
    const changes = method === 'regions'
      ? [{ iso_3166_1: null }, { english_name: 1 }, { native_name: false }]
      : [{ provider_id: 0 }, { provider_name: 1 }, { logo_path: null }, { display_priority: -1 },
        { display_priorities: [] }, { display_priorities: { US: '1' } }, { display_priorities: { US: -1 } }];
    for (const change of changes) invalid.push({ results: [{ ...item, ...change }] });
    for (const payload of invalid) await assert.rejects(methodsReturning(payload).methods[method](), (error) => {
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(String(error).includes('test-token'), false);
      return true;
    });
  });
}
