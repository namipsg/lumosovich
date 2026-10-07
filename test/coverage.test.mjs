import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich } from '../dist/index.js';
import { checkCoverage, loadCoverage } from '../scripts/check-coverage.mjs';
import { discoverQueryNames } from '../dist/discover.js';

const baseline = loadCoverage();
const { ledger, spec, contracts, responses } = baseline;

test('the ledger maps all pinned OpenAPI operations and completes the first group', () => {
  const coverage = checkCoverage(baseline);
  assert.equal(coverage.total, 152);
  const group = ledger.operations.filter((entry) =>
    /^\/3\/(find|search|configuration|certification|genre)(\/|$)/.test(entry.path));
  assert.equal(group.length, 18);
  assert.ok(group.every((entry) => entry.publicMethod));
});

test('the second group covers 12 movie, three collection, and three company operations', () => {
  const ids = [
    'movie-details', 'movie-alternative-titles', 'movie-changes', 'movie-credits',
    'movie-external-ids', 'movie-images', 'movie-keywords', 'movie-latest-id',
    'movie-release-dates', 'movie-translations', 'movie-videos', 'movie-watch-providers',
    'collection-details', 'collection-images', 'collection-translations',
    'company-details', 'company-alternative-names', 'company-images',
  ];
  assert.equal(ids.length, 18);
  assert.ok(ids.every((id) => ledger.operations.find((entry) => entry.operationId === id)?.publicMethod));
  assert.ok(checkCoverage(baseline).implemented >= 40);
});

test('the third group covers all 24 planned catalog, discovery, and exploration operations', () => {
  const ids = [
    'changes-movie-list', 'discover-movie', 'discover-tv', 'keyword-details',
    'keyword-movies', 'movie-now-playing-list', 'movie-popular-list',
    'movie-top-rated-list', 'movie-upcoming-list', 'movie-account-states',
    'movie-lists', 'movie-recommendations', 'movie-reviews', 'movie-similar',
    'movie-add-rating', 'movie-delete-rating', 'network-details', 'details-copy',
    'alternative-names-copy', 'review-details', 'trending-all',
    'trending-movies', 'trending-people', 'trending-tv',
  ];
  assert.equal(ids.length, 24);
  assert.ok(ids.every((id) => ledger.operations.find((entry) => entry.operationId === id)?.publicMethod));
  assert.equal(checkCoverage(baseline).implemented, 64);
  for (const kind of ['movie', 'tv']) {
    const expected = spec.paths[`/3/discover/${kind}`].get.parameters
      .filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name).sort();
    assert.deepEqual(discoverQueryNames[kind].sort(), expected);
  }
});

test('coverage checks fail for missing operations, incorrect routes, methods, or fixtures', () => {
  for (const mutate of [
    (data) => data.ledger.operations.pop(),
    (data) => data.ledger.operations.push(data.ledger.operations[0]),
    (data) => { data.ledger.operations[0].path = '/3/wrong'; },
    (data) => { data.ledger.operations[0].httpMethod = 'POST'; },
    (data) => { data.ledger.operations.find((entry) => entry.publicMethod).publicMethod = 'missing.method'; },
    (data) => { delete data.contracts['search-movie']; },
    (data) => { delete data.responses['configuration-details']; },
  ]) {
    const data = structuredClone(baseline);
    mutate(data);
    assert.throws(() => checkCoverage(data));
  }
});

for (const entry of ledger.operations.filter((operation) => operation.publicMethod)) {
  test(`OpenAPI contract: ${entry.operationId} → ${entry.publicMethod}`, async () => {
    const contract = contracts[entry.operationId];
    const response = responses[entry.operationId];
    const requests = [];
    const client = new Lumosovich({
      accessToken: 'contract-token',
      fetch: async (url, init) => {
        requests.push({ url: new URL(url), init });
        return new Response(JSON.stringify(response));
      },
    });
    const keys = entry.publicMethod.split('.');
    const method = keys.pop();
    const resource = keys.reduce((object, key) => object[key], client);
    assert.deepEqual(await resource[method](...contract.args), response);
    assert.equal(requests.length, 1);
    const { url, init } = requests[0];
    const expectedPath = entry.path.replace(/\{([^}]+)\}/g, (_match, key) => {
      assert.ok(Object.hasOwn(contract.pathParameters, key));
      return encodeURIComponent(contract.pathParameters[key]);
    });
    assert.equal(url.origin, 'https://api.themoviedb.org');
    assert.equal(url.pathname, expectedPath);
    assert.equal(init.method ?? 'GET', entry.httpMethod);
    assert.deepEqual(init.body === undefined ? undefined : JSON.parse(init.body), contract.body);
    assert.equal(init.headers['content-type'], entry.httpMethod === 'GET' ? undefined : 'application/json');
    assert.deepEqual(Object.fromEntries(url.searchParams), contract.query);
    const operation = spec.paths[entry.path][entry.httpMethod.toLowerCase()];
    const allowed = operation.parameters?.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name) ?? [];
    for (const key of url.searchParams.keys()) assert.ok(allowed.includes(key), `Unsupported parameter: ${key}`);
    assert.equal(init.headers.authorization, 'Bearer contract-token');
    assert.equal(init.headers.accept, 'application/json');
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(url.searchParams.has('api_key'), false);
  });
}
