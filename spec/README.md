# TMDB v3 coverage baseline

`tmdb-v3.openapi.json` is an unmodified snapshot of the
[official TMDB v3 OpenAPI](https://developer.themoviedb.org/openapi/tmdb-api.json),
retrieved on 2026-09-27. `coverage.json` records its SHA-256 checksum and all
152 operation IDs, HTTP methods, and paths. All 152 have public methods in 1.0.0.
The local image URL helper is not an API operation.

Run `npm run check:coverage` to validate the snapshot, ledger, public methods,
and fixture inventory and print the implemented operation count. `npm test`
also exercises each implemented method against its pinned request contract
and response example, and checks the exported TypeScript declarations.

After deliberately updating the snapshot, review its operation and parameter
changes, update the checksum and ledger, add request contracts for new methods,
then run `npm run fixtures:generate`. Response fixtures preserve upstream fields
but truncate arrays to two items and certifications to two regions. Request
contracts are reviewed manually so a fixture generator cannot bless an incorrect
public API or query mapping.
Run `npm run audit:parity` for an independent inventory of required paths, query
and header parameters, JSON body fields, and all 17 write operations. The
[write cleanup matrix](write-cleanup.json) records restoration paths and the
[audit report](../docs/parity-audit.md) states the limits of the pinned snapshot.
The official `movie-recommendations` example is an empty object, so its response
fixture uses the reviewed page shape in `test/fixtures/response-overrides.json`.

This snapshot and the development fixtures are excluded from the npm package.
