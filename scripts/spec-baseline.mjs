import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function readJson(path) {
  return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
}

export function loadBaseline() {
  const ledger = readJson('spec/coverage.json');
  const raw = readFileSync(new URL('../spec/tmdb-v3.openapi.json', import.meta.url));
  if (createHash('sha256').update(raw).digest('hex') !== ledger.sha256) {
    throw new Error('OpenAPI snapshot checksum changed; review and update the coverage baseline.');
  }
  return { ledger, spec: JSON.parse(raw) };
}

export function specOperations(spec) {
  return Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.entries(methods)
      .filter(([, operation]) => operation.operationId)
      .map(([method, operation]) => ({
        operationId: operation.operationId,
        httpMethod: method.toUpperCase(),
        path,
      })));
}
