# Contributing to Lumosovich

Thanks for helping expand TMDB v3 coverage. Before starting a large change, open an issue so the public method and endpoint scope can be discussed.

## Local setup

Use a maintained Node.js version supported by `package.json` (Node 22 or newer), then run:

```bash
npm ci
npm test
```

The offline suite builds the ESM and CommonJS packages, checks TypeScript declarations, validates the pinned TMDB OpenAPI coverage ledger, and tests request/response contracts. It needs no TMDB credential.

## Adding an API operation

1. Find the operation ID, HTTP method, parameters, and response in `spec/tmdb-v3.openapi.json`. The snapshot is pinned and should only change as part of a deliberate spec update.
2. Add a clear method under the appropriate resource namespace. Keep TMDB's numeric IDs and `snake_case` response fields; do not invent values that TMDB did not return.
3. Export typed inputs and results, validate caller inputs before fetching, and reject malformed upstream responses with safe errors.
4. Set the matching `publicMethod` in `spec/coverage.json` and add a reviewed request entry to `test/fixtures/contracts.json`.
5. Run `npm run fixtures:generate` to create the compact response fixture from the pinned OpenAPI example. Add focused tests for behavior the contract fixture cannot establish.
6. Update the README and `test/live-smoke.mjs` where appropriate, then run `npm test` and `npm run check:coverage`.

If you deliberately update the OpenAPI snapshot, follow [the coverage baseline](spec/README.md) to review its checksum, operation changes, and fixture impact.

## Live tests and pull requests

Run `TMDB_API_KEY=... npm run test:live` only with your own key, or use `TMDB_ACCESS_TOKEN`. Never commit credentials or paste unredacted request URLs into issues or pull requests. The CI checks are offline so pull requests from forks do not need secrets.

Keep pull requests focused. Describe the resulting behavior, list affected operation IDs, and include relevant test results. Changes to the minimum supported Node version or public types should be called out as compatibility changes.

For suspected vulnerabilities, use [the private reporting instructions](SECURITY.md) instead of a public issue.
