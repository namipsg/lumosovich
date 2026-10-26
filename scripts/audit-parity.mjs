import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Lumosovich } from '../dist/index.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const keys = (object) => Object.keys(object).sort();

export function auditParity({ spec, ledger, contracts, responses }, client) {
  const observed = Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.entries(methods).filter(([, operation]) => operation?.operationId)
      .map(([method, operation]) => ({ path, httpMethod: method.toUpperCase(), operation })));
  assert.equal(observed.length, 152, 'Pinned TMDB v3 specification must contain 152 operations');
  assert.equal(ledger.operations.length, observed.length, 'Coverage ledger must contain every operation');

  const byId = new Map();
  for (const entry of ledger.operations) {
    assert.ok(!byId.has(entry.operationId), `Duplicate ledger operation ${entry.operationId}`);
    byId.set(entry.operationId, entry);
  }
  assert.deepEqual(keys(contracts), keys(Object.fromEntries(observed.map(({ operation }) =>
    [operation.operationId, true]))), 'Request contracts must cover every operation');
  assert.deepEqual(keys(responses), keys(contracts), 'Response fixtures must cover every request contract');

  const publicMethods = new Set();
  let writes = 0;
  for (const { path, httpMethod, operation } of observed) {
    const id = operation.operationId;
    const entry = byId.get(id);
    assert.ok(entry, `Missing ledger operation ${id}`);
    assert.equal(entry.path, path, `${id}: wrong path`);
    assert.equal(entry.httpMethod, httpMethod, `${id}: wrong HTTP method`);
    assert.ok(entry.publicMethod && typeof entry.publicMethod === 'string', `${id}: missing public method`);
    assert.ok(!publicMethods.has(entry.publicMethod), `${id}: duplicate public method`);
    publicMethods.add(entry.publicMethod);
    assert.equal(typeof entry.publicMethod.split('.').reduce((part, name) => part?.[name], client),
      'function', `${id}: public method is not callable`);

    const contract = contracts[id];
    assert.ok(Array.isArray(contract.args), `${id}: missing call arguments`);
    assert.ok(contract.query && typeof contract.query === 'object', `${id}: missing query contract`);
    const pathNames = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(keys(contract.pathParameters ?? {}), pathNames,
      `${id}: path argument names differ from the specification`);

    const parameters = operation.parameters ?? [];
    const queryNames = parameters.filter((parameter) => parameter.in === 'query')
      .map((parameter) => parameter.name);
    for (const name of keys(contract.query)) {
      assert.ok(queryNames.includes(name), `${id}: unsupported query ${name}`);
    }
    for (const parameter of parameters.filter((parameter) => parameter.in === 'query' && parameter.required)) {
      assert.ok(Object.hasOwn(contract.query, parameter.name),
        `${id}: missing required query ${parameter.name}`);
    }
    const requiredHeaders = parameters.filter((parameter) => parameter.in === 'header' && parameter.required)
      .map((parameter) => parameter.name.toLowerCase());
    for (const header of requiredHeaders) {
      assert.equal(header, 'content-type', `${id}: untested required header ${header}`);
      assert.notEqual(httpMethod, 'GET', `${id}: GET unexpectedly requires a JSON content type`);
    }

    const example = Object.values(operation.requestBody?.content?.['application/json']?.examples ?? {})[0]?.value;
    if (example !== undefined) {
      const exampleBody = typeof example === 'string' ? JSON.parse(example) : example;
      assert.deepEqual(keys(contract.body ?? {}), keys(exampleBody),
        `${id}: JSON body fields differ from the documented request example`);
    } else {
      assert.equal(contract.body, undefined, `${id}: unexpected JSON body`);
    }
    if (httpMethod === 'GET') assert.equal(contract.body, undefined, `${id}: GET must not send JSON`);
    else writes += 1;
    assert.ok(responses[id] !== undefined, `${id}: missing response fixture`);
  }
  assert.equal(writes, 17, 'Expected 17 POST or DELETE operations');
  return { operations: observed.length, reads: observed.length - writes, writes };
}

export function auditRepository() {
  const raw = readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url));
  const ledger = readJson('spec/coverage.json');
  assert.equal(createHash('sha256').update(raw).digest('hex'), ledger.sha256,
    'Pinned OpenAPI checksum changed');
  const client = new Lumosovich({ apiKey: 'audit-only', fetch: async () => {
    throw new Error('Parity audit must not access TMDB');
  } });
  return auditParity({
    spec: JSON.parse(raw), ledger,
    contracts: readJson('test/fixtures/contracts.json'),
    responses: readJson('test/fixtures/responses.json'),
  }, client);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = auditRepository();
  console.log(`Independent TMDB v3 parity audit passed: ${summary.operations} operations, ${summary.reads} GET, ${summary.writes} writes.`);
}
