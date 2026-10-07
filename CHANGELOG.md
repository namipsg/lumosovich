# Changelog

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
