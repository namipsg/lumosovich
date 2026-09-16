import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

const emptyFindResponse = () => ({
  movie_results: [],
  tv_results: [],
  tv_season_results: [],
  tv_episode_results: [],
  person_results: [],
});

test('maps 404 and 429 to safe typed errors without retrying', async () => {
  for (const [status, code] of [
    [404, 'HTTP_ERROR'],
    [429, 'RATE_LIMITED'],
  ]) {
    let calls = 0;
    const client = new Lumosovich({
      apiKey: 'secret-key',
      fetch: async () => {
        calls += 1;
        return new Response('upstream secret-key diagnostic', { status });
      },
    });

    await assert.rejects(
      client.find.byExternalId('tt1375666', 'imdb_id'),
      (error) => {
        assert.ok(error instanceof TmdbError);
        assert.equal(error.code, code);
        assert.equal(error.status, status);
        assert.equal(String(error).includes('secret-key'), false);
        assert.equal(JSON.stringify(error).includes('secret-key'), false);
        return true;
      },
    );
    assert.equal(calls, 1);
  }
});

test('redacts network failures and times out a stalled request', async () => {
  const networkClient = new Lumosovich({
    accessToken: 'secret-token',
    fetch: async () => {
      throw new Error('failed at https://api.themoviedb.org/secret-token');
    },
  });
  await assert.rejects(
    networkClient.find.byExternalId('tt1375666', 'imdb_id'),
    (error) => {
      assert.equal(error.code, 'NETWORK_ERROR');
      assert.equal(String(error).includes('secret-token'), false);
      assert.equal(error.cause, undefined);
      return true;
    },
  );

  let signal;
  const timeoutClient = new Lumosovich({
    apiKey: 'secret-key',
    timeoutMs: 5,
    fetch: (_url, init) => {
      signal = init.signal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    },
  });
  await assert.rejects(
    timeoutClient.find.byExternalId('tt1375666', 'imdb_id'),
    (error) => error instanceof TmdbError && error.code === 'TIMEOUT',
  );
  assert.equal(signal.aborted, true);
});

test('rejects invalid JSON and malformed find responses', async () => {
  const invalidJson = new Lumosovich({
    apiKey: 'key',
    fetch: async () => new Response('not-json', { status: 200 }),
  });
  await assert.rejects(
    invalidJson.find.byExternalId('tt1375666', 'imdb_id'),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );

  const malformed = new Lumosovich({
    apiKey: 'key',
    fetch: async () =>
      new Response(JSON.stringify({ movie_results: [{ id: '27205' }] })),
  });
  await assert.rejects(
    malformed.find.byExternalId('tt1375666', 'imdb_id'),
    (error) => error instanceof TmdbError && error.code === 'INVALID_RESPONSE',
  );
});

test('supports per-request language and validates configuration', async () => {
  const requests = [];
  const client = new Lumosovich({
    apiKey: 'key',
    language: 'en-US',
    fetch: async (url) => {
      requests.push(new URL(url));
      return new Response(JSON.stringify(emptyFindResponse()));
    },
  });
  await client.find.byExternalId('tt1375666', 'imdb_id', { language: 'fa-IR' });
  assert.equal(requests[0].searchParams.get('language'), 'fa-IR');

  assert.throws(() => new Lumosovich({ apiKey: 'key', language: '' }), TypeError);
  assert.throws(() => new Lumosovich({ apiKey: 'key', timeoutMs: 0 }), TypeError);
  assert.throws(() => new Lumosovich({ apiKey: 'key', timeoutMs: -1 }), TypeError);
  assert.throws(() => new Lumosovich({ apiKey: 'key', fetch: null }), TypeError);
});
