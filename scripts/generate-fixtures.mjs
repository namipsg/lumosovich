import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadBaseline, readJson } from './spec-baseline.mjs';

// Keep two items per array and two certification/provider regions; retain raw field names.
function compact(value) {
  if (Array.isArray(value)) return value.slice(0, 2).map(compact);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
      key === 'certifications'
        ? Object.fromEntries(Object.entries(item).slice(0, 2).map(([region, list]) => [region, compact(list)]))
        : compact(item),
    ]));
  }
  return value;
}

const { ledger, spec } = loadBaseline();
const fixtures = {};
for (const entry of ledger.operations.filter((operation) => operation.publicMethod)) {
  const operation = spec.paths[entry.path][entry.httpMethod.toLowerCase()];
  const examples = operation.responses['200']?.content?.['application/json']?.examples;
  const example = Object.values(examples ?? {})[0]?.value;
  if (example === undefined) throw new Error(`No official example for ${entry.operationId}`);
  const fixture = compact(typeof example === 'string' ? JSON.parse(example) : example);
  if (entry.operationId === 'movie-watch-providers') {
    fixture.results = Object.fromEntries(Object.entries(fixture.results).slice(0, 2));
  }
  fixtures[entry.operationId] = fixture;
}
if (process.argv.includes('--check')) {
  assert.deepEqual(readJson('test/fixtures/responses.json'), fixtures, 'Response fixtures differ from the pinned OpenAPI examples; run npm run fixtures:generate.');
  console.log(`Verified ${Object.keys(fixtures).length} pinned response fixtures.`);
} else {
  mkdirSync(new URL('../test/fixtures/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../test/fixtures/responses.json', import.meta.url), JSON.stringify(fixtures, null, 2) + '\n');
  console.log(`Generated ${Object.keys(fixtures).length} response fixtures from the pinned OpenAPI examples.`);
}
