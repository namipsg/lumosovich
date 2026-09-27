import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Lumosovich } from '../dist/index.js';
import { loadBaseline, readJson, specOperations } from './spec-baseline.mjs';

export function checkCoverage({ ledger, spec, contracts, responses }) {
  const expected = specOperations(spec);
  const operations = ledger.operations;
  assert.equal(new Set(expected.map((entry) => entry.operationId)).size, expected.length, 'Duplicate OpenAPI operation ID');
  assert.equal(new Set(operations.map((entry) => entry.operationId)).size, operations.length, 'Duplicate coverage entry');
  assert.deepEqual(
    operations.map(({ publicMethod, ...entry }) => entry).sort((a, b) => a.operationId.localeCompare(b.operationId)),
    expected.sort((a, b) => a.operationId.localeCompare(b.operationId)),
    'Coverage ledger must describe every OpenAPI operation with the correct path and HTTP method',
  );
  const implemented = operations.filter((entry) => entry.publicMethod !== null);
  assert.equal(new Set(implemented.map((entry) => entry.publicMethod)).size, implemented.length, 'Duplicate public method');
  const client = new Lumosovich({ apiKey: 'coverage-check', fetch: async () => {
    throw new Error('Coverage checks must never access the network');
  } });
  for (const entry of implemented) {
    assert.equal(typeof entry.publicMethod, 'string');
    const method = entry.publicMethod.split('.').reduce((object, key) => object?.[key], client);
    assert.equal(typeof method, 'function', `Missing public method: ${entry.publicMethod}`);
    assert.ok(Array.isArray(contracts[entry.operationId]?.args), `Missing request contract: ${entry.operationId}`);
    assert.ok(Object.hasOwn(responses, entry.operationId), `Missing response fixture: ${entry.operationId}`);
  }
  for (const fixtures of [contracts, responses]) {
    assert.deepEqual(Object.keys(fixtures).sort(), implemented.map((entry) => entry.operationId).sort(), 'Fixtures must match implemented operations');
  }
  return { implemented: implemented.length, total: expected.length };
}

export function loadCoverage() {
  return {
    ...loadBaseline(),
    contracts: readJson('test/fixtures/contracts.json'),
    responses: readJson('test/fixtures/responses.json'),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { implemented, total } = checkCoverage(loadCoverage());
  console.log(`TMDB v3 coverage: ${implemented}/${total} operations (${(implemented / total * 100).toFixed(1)}%).`);
}
