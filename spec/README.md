# TMDB v3 coverage baseline

`tmdb-v3.openapi.json` is an unmodified snapshot of the
[official TMDB v3 OpenAPI](https://developer.themoviedb.org/openapi/tmdb-api.json),
retrieved on 2026-09-27. `coverage.json` records its SHA-256 checksum and all
152 operation IDs, HTTP methods, and paths. A `null` public method means the
operation is not yet implemented. The local image URL helper is not an API operation.

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

This snapshot and the development fixtures are excluded from the npm package.
