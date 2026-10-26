# TMDB v3 parity audit for 1.0.0

The library covers all **152 operations** in the official TMDB v3 OpenAPI snapshot retrieved on **2026-09-27**. The snapshot SHA-256 is `1c709375fe994e58c5a35aba7c9abfa7f28aa7103ed6c2052ea5ab0b62af081b`. It contains **135 GET** and **17 POST/DELETE** operations. The [coverage ledger](../spec/coverage.json) maps each operation to one callable public method.

Run `npm run audit:parity` to independently enumerate the snapshot and compare operation IDs, paths and HTTP methods with the ledger. The audit checks callable methods, complete request/response fixture inventories, route placeholders, required query and header parameters, allowed query names, and JSON body keys from the official request examples. `npm test` also invokes every mapped method through a mocked HTTP client, checks the full request and response fixture, compiles public TypeScript examples, and exercises malformed responses and inputs.

The separate [write cleanup matrix](../spec/write-cleanup.json) covers all 17 mutation operations. An offline lifecycle test demonstrates restoration after a simulated failure. The opt-in live smoke test uses a TMDB key for 122 public and temporary-session GET routes. Account and user-session writes were not run live because no disposable user account and cleanup evidence were available. TMDB currently returns only `{ "success": true }` for key validation; the pinned example also contains status fields, and both forms are covered by tests.

This is parity with the **pinned** snapshot, not a claim that TMDB's live API will never add or change endpoints. Updating the snapshot requires a reviewed specification diff, coverage/fixture update, and a rerun of this audit and the live checks.
