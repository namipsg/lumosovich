# Changelog

## 0.7.1 — 2026-10-18

- Publish the library under `tmdb-lumosovich` on npm, replacing the `lumosovich` package name. Existing `lumosovich` versions remain installable; update package imports to the new name.
- Add accurate IMDb ID lookup terms to npm metadata and README examples. The library still returns TMDB data and does not provide IMDb ratings or an IMDb API.
- Keep the public `Lumosovich` class and TMDB v3 operation coverage unchanged at 109 of 152.

## 0.7.0 — 2026-10-18

- Add 22 TV operations for series change feeds, episode groups, season and episode metadata, account states, and episode ratings. This completes all 48 TV operations in the pinned TMDB v3 specification and brings total coverage to 109 of 152.
- Add typed responses and options, request contracts, generated response fixtures, and focused validation tests for the new methods.
- Exercise all 99 public read operations with the read-only live smoke test; session-scoped operations are checked with offline contracts.

## 0.6.1 — 2026-10-10

- Update the pinned `actions/setup-node` GitHub Action to v7.1.0 in CI and the release workflow.
- Keep the public API and TMDB v3 operation coverage unchanged at 87 of 152 operations.

## 0.6.0 — 2026-10-10

- Add 23 TV series operations for catalogs, credits, metadata, recommendations, reviews, watch providers, and ratings, bringing coverage to 87 of 152 TMDB v3 operations.
- Add typed TV series responses and options, request contracts, response fixtures, and validation tests.
- Exercise all 81 public read operations in the read-only live smoke test; session-scoped methods remain covered by offline contracts.

## 0.5.1 — 2026-10-07

- Update the development compiler to TypeScript 7.0.2 and refresh the pinned GitHub Actions versions for checkout and Node setup.
- Keep the public API and TMDB operation coverage unchanged at 64 of 152 operations.

## 0.5.0 — 2026-10-07

- Add 24 TMDB v3 operations for movie catalogs and changes, Discover, Trending, reviews, keywords, networks, and movie ratings, bringing coverage to 64 of 152.
- Add typed Discover filters for every query parameter in the pinned spec, explicit session-scoped rating methods, and response validation for the new resources.
- Extend the offline contract and type checks and run a read-only live smoke test across all 61 public read operations.

## 0.4.0 — 2026-10-03

- Require Node.js 22 or newer, aligning the supported runtime with maintained Node releases. The public Lumosovich API is unchanged.
- Add GitHub CI across Node 22, 24, and 26, plus an npm trusted-publishing release workflow.
- Add contribution, conduct, and security guidance with issue and pull request templates.

## 0.3.0 — 2026-10-03

- Add movie metadata, collection, and company methods, bringing TMDB v3 operation coverage to 40 of 152.
- Add request contracts, generated response fixtures, types, offline tests, and live smoke checks for the new endpoints.

## 0.2.0 — 2026-09-27

- Complete Find, Search, Configuration, Certifications, and Genres coverage, reaching 23 of 152 TMDB v3 operations.
- Introduce the pinned OpenAPI coverage ledger and response fixtures.
- Distribute the package under the MIT license from this version onward.
