import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Lumosovich } from '../dist/index.js';
import { auditParity, auditRepository } from '../scripts/audit-parity.mjs';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const baseline = {
  spec: readJson('spec/tmdb-v3.openapi.json'),
  ledger: readJson('spec/coverage.json'),
  contracts: readJson('test/fixtures/contracts.json'),
  responses: readJson('test/fixtures/responses.json'),
};
const client = new Lumosovich({ apiKey: 'offline-audit', fetch: async () => {
  throw new Error('Parity audit cannot access the network');
} });

test('independent parity audit covers every pinned operation and all writes', () => {
  assert.deepEqual(auditRepository(), { operations: 152, reads: 135, writes: 17 });
});

test('parity audit rejects unmapped, duplicated and nonexistent public methods', () => {
  for (const mutate of [
    (data) => { data.ledger.operations[0].publicMethod = null; },
    (data) => { data.ledger.operations[0].publicMethod = data.ledger.operations[1].publicMethod; },
    (data) => { data.ledger.operations[0].publicMethod = 'authentication.missing'; },
  ]) {
    const data = structuredClone(baseline);
    mutate(data);
    assert.throws(() => auditParity(data, client));
  }
});

test('parity audit rejects request-contract drift against pinned OpenAPI', () => {
  for (const mutate of [
    (data) => { delete data.contracts['find-by-id'].query.external_source; },
    (data) => { data.contracts['account-details'].query.unsupported = '1'; },
    (data) => { data.contracts['account-details'].pathParameters = {}; },
    (data) => { delete data.contracts['account-add-favorite'].body.favorite; },
    (data) => { data.contracts['authentication-delete-session'].body = undefined; },
    (data) => { data.contracts['movie-details'].body = { unexpected: true }; },
    (data) => { delete data.responses['authentication-create-session']; },
  ]) {
    const data = structuredClone(baseline);
    mutate(data);
    assert.throws(() => auditParity(data, client));
  }
});
