# Lumosovich ✨

[![npm version](https://img.shields.io/npm/v/lumosovich.svg)](https://www.npmjs.com/package/lumosovich)
[![license](https://img.shields.io/npm/l/lumosovich.svg)](./LICENSE)

A small, typed Node.js wrapper for the TMDB API.

**Lumosovich** is being built incrementally for movies, TV shows, people, search, and other data available through The Movie Database API. It currently supports IMDb-ID lookup, search, and movie, TV, and person details.

The name comes from **Lumos** — a spell for bringing light — with a little Russian-style `-ovich` treatment.

Light up the movie database.

## Current status

Lumosovich is available on [npm](https://www.npmjs.com/package/lumosovich). This is an early `0.x` release with IMDb-ID lookup, search, movie/TV/person details, and TV season/episode details.

## Installation

```bash
npm install lumosovich
```

Requires Node.js 18+ and a TMDB v3 API key or API Read Access Token. Keep your credential in an environment variable; do not commit it to your project.

## Quick Start

Set `TMDB_API_KEY` in your environment before running this example:

```js
import { Lumosovich } from 'lumosovich';

const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY,
});

const matches = await tmdb.find.byExternalId('tt1375666', 'imdb_id');
const movieId = matches.movie_results[0]?.id;

console.log(movieId);
// A numeric TMDB ID, if TMDB has a match

if (movieId) {
  const movie = await tmdb.movies.get(movieId);
  console.log(movie.title);
}
```

CommonJS projects can use `const { Lumosovich } = require('lumosovich');` instead.

## Why Lumosovich?

Working directly with an HTTP API shouldn't mean repeating URLs, query parameters, authentication, and TypeScript definitions throughout your application.

Lumosovich puts a small, predictable API between your application and TMDB. It keeps TMDB's numeric IDs and `snake_case` response fields intact. IMDb IDs such as `tt1375666` and `nm0000138` are external IDs, not interchangeable with TMDB IDs.

```js
const matches = await tmdb.find.byExternalId('nm0000138', 'imdb_id');
const personId = matches.person_results[0]?.id;
```

The full find response is returned. Empty arrays mean no match; if TMDB returns multiple hits, Lumosovich does not guess which one to use.

## Search

```js
const movies = await tmdb.search.movies('Inception', { year: 2010, page: 1 });
const shows = await tmdb.search.tv('Game of Thrones', {
  firstAirDateYear: 2011,
});
const mixed = await tmdb.search.multi('The Office');
```

Search returns TMDB's paginated `page`, `results`, `total_pages`, and `total_results` fields. Multi-search can include people as well as movies and TV shows; callers that want only content should filter `results` by `media_type`. TMDB multi-search has no year parameter, so year filtering belongs in the caller. Search options use `page`, `language`, and `includeAdult`; movie search also accepts `year`, `primaryReleaseYear`, and `region`, while TV search accepts `year` and `firstAirDateYear`.

## Details and optional enrichment

Detail methods require numeric TMDB IDs. By default they fetch only the top-level record:

```js
const movie = await tmdb.movies.get(27205);
const show = await tmdb.tv.get(1399);
const person = await tmdb.people.get(6193);
```

Use `append` to request relevant same-namespace data in the same HTTP call:

```js
const enrichedMovie = await tmdb.movies.get(27205, {
  language: 'fa-IR',
  append: ['credits', 'images', 'videos', 'external_ids', 'release_dates'],
  imageLanguages: ['fa', 'en', 'null'],
});

const enrichedShow = await tmdb.tv.get(1399, {
  append: ['aggregate_credits', 'images', 'content_ratings'],
  imageLanguages: ['en', 'null'],
});

const enrichedPerson = await tmdb.people.get(6193, {
  append: ['combined_credits', 'external_ids'],
});
```

`imageLanguages` requires `images` in `append`; `'null'` includes language-neutral assets. For TV, `aggregate_credits` covers the whole series, whereas `credits` represents the latest season. Responses retain TMDB fields and image paths rather than inventing IMDb-shaped values: `vote_average` is a TMDB score, not an IMDb rating, and person details do not provide awards or height.

## Seasons and episodes

```js
const season = await tmdb.tv.seasons.get(1399, 1);
const firstEpisode = season.episodes.find((episode) => episode.episode_number === 1);

if (firstEpisode) {
  const detail = await tmdb.tv.episodes.get(1399, 1, 1, {
    append: ['external_ids', 'images'],
    imageLanguages: ['en', 'null'],
  });
  console.log(detail.id, detail.external_ids?.imdb_id);
}
```

Season and episode coordinates are numeric TMDB identifiers and slots. Season `0` is supported for specials. The wrapper checks returned series and episode identity before passing details to callers; missing IMDb IDs remain missing rather than being fabricated.

## Image URLs

TMDB detail responses contain image paths. Build a safe public image URL with:

```js
const posterUrl = tmdb.images.url('/poster.jpg', 'w500');
```

The size defaults to `original`. Missing paths return `undefined`; invalid paths or unsupported sizes throw a `TypeError`.

## TypeScript

The package ships ESM and CommonJS entry points plus TypeScript declarations. Responses retain upstream `snake_case` fields.

```ts
import { Lumosovich, type FindResponse } from 'lumosovich';

const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY!,
});

const matches: FindResponse = await tmdb.find.byExternalId(
  'tt1375666',
  'imdb_id',
);
```

## Configuration

```js
const tmdb = new Lumosovich({
  apiKey: process.env.TMDB_API_KEY,
  language: 'en-US',
});
```

Additional configuration options will be documented as the library evolves.

Supply exactly one credential: a v3 `apiKey` or an API Read Access `accessToken`. `language` defaults to `en-US` and can be overridden per call. Requests time out after 10 seconds by default; set `timeoutMs` to change this. An injectable `fetch` is available for testing.

## Error Handling

```js
try {
  const matches = await tmdb.find.byExternalId('tt1375666', 'imdb_id');
} catch (error) {
  console.error(error);
}
```

Failures throw `TmdbError` with `code` and, for HTTP failures, `status`. Codes are `HTTP_ERROR`, `RATE_LIMITED`, `TIMEOUT`, `NETWORK_ERROR`, and `INVALID_RESPONSE`. Errors do not echo request URLs, credentials, or upstream response bodies. A `429` is surfaced without automatic retry so callers can decide when to try again.

## Requirements

* Node.js 18+
* A TMDB API key or API Read Access Token

## Development

From a checkout, install dependencies and run the offline test suite:

```bash
npm ci
npm test
```

Build the package:

```bash
npm run build
```

With a local TMDB v3 key, run the opt-in live smoke test:

```bash
TMDB_API_KEY=... npm run test:live
```

The key is read from the environment, never from a tracked file. This checks a small stable movie/TV/person fixture and the season/episode path; it is separate from the offline test suite.

## Roadmap

Trending and broader TMDB coverage can follow the initial IMDb-ID lookup, search, and detail workflows.

The goal is to cover the TMDB API while keeping the library:

* simple
* strongly typed
* predictable
* well documented
* pleasant to use

## Contributing

Issues, bug reports, feature requests, and pull requests are welcome.

If you're proposing a new API, try to keep it consistent with the rest of Lumosovich and reasonably close to the concepts used by TMDB itself.

## Disclaimer

Lumosovich is an independent project and is not affiliated with or endorsed by TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

GPL-3.0-only; see [LICENSE](./LICENSE).

---

**Lumosovich** — shed some light on TMDB. ✨
