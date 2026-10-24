import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich, TmdbError } from '../dist/index.js';

function clientWith(payload) {
  const requests = [];
  const client = new Lumosovich({ accessToken: 'test', fetch: async (url) => {
    requests.push(new URL(url));
    return new Response(JSON.stringify(payload));
  } });
  return { client, requests };
}

test('person and credit inputs fail before sending a request', async () => {
  const { client, requests } = clientWith({});
  for (const call of [
    () => client.people.changes(0),
    () => client.people.movieCredits(-1),
    () => client.people.taggedImages(31, { page: 0 }),
    () => client.people.popular({ page: 1.5 }),
    () => client.people.changeList({ startDate: '2024-02-30' }),
    () => client.people.changes(31, { startDate: '2024-02-01', endDate: '2024-01-01' }),
    () => client.credits.get(' '),
    () => client.credits.get('..'),
  ]) await assert.rejects(call, TypeError);
  assert.equal(requests.length, 0);
});

test('person resources reject malformed identities and nested collections', async () => {
  const checks = [
    [{ id: 32, cast: [], crew: [] }, (client) => client.people.movieCredits(31)],
    [{ id: 31, cast: [{}], crew: [] }, (client) => client.people.combinedCredits(31)],
    [{ id: 31, profiles: [{ width: 10 }] }, (client) => client.people.images(31)],
    [{ id: 31, translations: [{ name: 'x' }] }, (client) => client.people.translations(31)],
    [{ page: 1, total_pages: 1, total_results: 1, results: [{ id: 31 }] },
      (client) => client.people.popular()],
    [{ id: 31, page: 1, total_pages: 1, total_results: 1, results: [{ id: 123 }] },
      (client) => client.people.taggedImages(31)],
    [{ id: 'credit', credit_type: 'cast', media_type: 'movie', person: { id: 31, name: 'Actor' }, media: {} },
      (client) => client.credits.get('credit')],
  ];
  for (const [payload, call] of checks) {
    await assert.rejects(() => call(clientWith(payload).client), (error) =>
      error instanceof TmdbError && error.code === 'INVALID_RESPONSE');
  }
});

test('tagged images and credit details preserve upstream data and safe paths', async () => {
  const tagged = { id: 31, page: 0, total_pages: 1, total_results: 1, extra: 'retained',
    results: [{ id: 'image-id', file_path: '/image.jpg', image_type: 'profile',
      media_type: 'episode', media: { id: 550 }, vote_count: 4 }] };
  const images = clientWith(tagged);
  assert.equal((await images.client.people.taggedImages(31)).extra, 'retained');
  assert.equal(images.requests[0].searchParams.has('language'), false);

  const credit = { id: 'credit/id?', credit_type: 'cast', media_type: 'movie',
    person: { id: 31, name: 'Actor' }, media: { id: 550 }, extra: 'retained' };
  const details = clientWith(credit);
  assert.equal((await details.client.credits.get(' credit/id? ')).extra, 'retained');
  assert.equal(details.requests[0].pathname, '/3/credit/credit%2Fid%3F');
});
