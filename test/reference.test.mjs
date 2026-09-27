import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

const configuration = {
  images: {
    base_url: 'http://image.tmdb.org/t/p/', secure_base_url: 'https://image.tmdb.org/t/p/',
    backdrop_sizes: ['original'], logo_sizes: ['original'], poster_sizes: ['w500', 'original'],
    profile_sizes: ['original'], still_sizes: ['original'],
  },
  change_keys: ['title'],
};
const certifications = { certifications: {
  US: [{ certification: 'PG', meaning: 'Parental guidance', order: 2 }],
  'CA-QC': [{ certification: 'G', meaning: 'General', order: 0 }],
} };
const cases = [
  ['configuration', 'get', 'configuration', configuration, false],
  ['configuration', 'countries', 'configuration/countries', [
    { iso_3166_1: 'IR', english_name: 'Iran', native_name: 'ایران' },
  ], true],
  ['configuration', 'jobs', 'configuration/jobs', [{ department: 'Camera', jobs: ['Director of Photography'] }], false],
  ['configuration', 'languages', 'configuration/languages', [{ iso_639_1: 'fa', english_name: 'Persian', name: 'فارسی' }], false],
  ['configuration', 'primaryTranslations', 'configuration/primary_translations', ['en-US', 'fa-IR'], false],
  ['configuration', 'timezones', 'configuration/timezones', [{ iso_3166_1: 'IR', zones: ['Asia/Tehran'] }], false],
  ['certifications', 'movies', 'certification/movie/list', certifications, false],
  ['certifications', 'tv', 'certification/tv/list', certifications, false],
  ['genres', 'movies', 'genre/movie/list', { genres: [{ id: 18, name: 'Drama' }] }, true],
  ['genres', 'tv', 'genre/tv/list', { genres: [{ id: 18, name: 'Drama' }] }, true],
];

function clientReturning(payload) {
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'test-key', language: 'en-US',
    fetch: async (url, init) => {
      requests.push({ url: new URL(url), init });
      return new Response(JSON.stringify(payload));
    },
  });
  return { client, requests };
}

for (const [namespace, method, path, payload, localized] of cases) {
  test(`${namespace}.${method} preserves raw data and sends supported parameters`, async () => {
    const { client, requests } = clientReturning(payload);
    const args = localized ? [{ language: 'fa-IR' }] : [];
    assert.deepEqual(await client[namespace][method](...args), payload);
    assert.equal(requests[0].url.pathname, `/3/${path}`);
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), {
      ...(localized ? { language: 'fa-IR' } : {}), api_key: 'test-key',
    });
    assert.equal(requests[0].init.headers.accept, 'application/json');
    if (localized) {
      await client[namespace][method]();
      assert.equal(requests[1].url.searchParams.get('language'), 'en-US');
      await assert.rejects(client[namespace][method]({ language: '' }), TypeError);
      assert.equal(requests.length, 2);
    }
  });
}

test('reference endpoints reject malformed response fields with safe errors', async () => {
  const invalid = [
    ['configuration', 'get', { ...configuration, change_keys: [1] }],
    ['configuration', 'get', { ...configuration, images: { ...configuration.images, poster_sizes: null } }],
    ['configuration', 'get', {}],
    ['configuration', 'countries', [{ iso_3166_1: 'US', english_name: 1, native_name: 'US' }]],
    ['configuration', 'jobs', [{ department: 'Camera', jobs: [1] }]],
    ['configuration', 'languages', [{ iso_639_1: 'en', english_name: 'English', name: null }]],
    ['configuration', 'primaryTranslations', [42]],
    ['configuration', 'timezones', [{ iso_3166_1: 'US', zones: 'UTC' }]],
    ['certifications', 'movies', { certifications: { US: [{ certification: 'PG', meaning: 'Guidance', order: -1 }] } }],
    ['certifications', 'tv', { certifications: { US: null } }],
    ['genres', 'movies', { genres: [{ id: 0, name: 'Drama' }] }],
    ['genres', 'tv', { genres: [{ id: 18, name: null }] }],
  ];
  for (const [namespace, method, payload] of invalid) {
    const { client } = clientReturning(payload);
    await assert.rejects(client[namespace][method](), (error) => {
      assert.ok(error instanceof TmdbError);
      assert.equal(error.code, 'INVALID_RESPONSE');
      assert.equal(String(error).includes('test-key'), false);
      return true;
    });
  }
  for (const [namespace, method] of cases) {
    for (const payload of [null, 'upstream diagnostic', 1]) {
      const { client } = clientReturning(payload);
      await assert.rejects(client[namespace][method](), { code: 'INVALID_RESPONSE' });
    }
  }
});

test('reference endpoints preserve empty lists and extra upstream fields', async () => {
  for (const [namespace, method, , payload] of cases) {
    const empty = Array.isArray(payload) ? [] :
      namespace === 'genres' ? { genres: [], extra: true } :
      namespace === 'certifications' ? { certifications: {}, extra: true } :
      { ...configuration, extra: true };
    const { client } = clientReturning(empty);
    assert.deepEqual(await client[namespace][method](), empty);
  }
});
